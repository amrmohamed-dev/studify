import mongoose from 'mongoose';
import Session from './session.model.js';
import AppError from '../../utils/error/appError.js';
import validateObjectId from '../../utils/validateObjectId.js';
import createNotification from '../../utils/notification.util.js';
import { emitSessionEnded, emitSessionStarted } from './session.socket.js';

const DEFAULT_STUDY_DURATION_MINUTES = Number(
  process.env.SESSION_DEFAULT_STUDY_MINUTES || 50,
);
const DEFAULT_BREAK_DURATION_MINUTES = Number(
  process.env.SESSION_DEFAULT_BREAK_MINUTES || 10,
);

const ROOM_RELATION_KEYS = [
  'members',
  'participants',
  'users',
  'owner',
  'createdBy',
  'host',
  'admins',
  'moderators',
];

const getRoomModel = () => {
  try {
    return mongoose.model('Room');
  } catch (error) {
    if (error.name === 'MissingSchemaError') {
      return null;
    }

    throw error;
  }
};

const collectObjectIds = (value, bucket) => {
  if (!value) return;

  if (value instanceof mongoose.Types.ObjectId) {
    bucket.add(value.toString());
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectObjectIds(item, bucket));
    return;
  }

  if (typeof value === 'string') {
    if (mongoose.Types.ObjectId.isValid(value)) {
      bucket.add(value);
    }

    return;
  }

  if (typeof value !== 'object') {
    return;
  }

  if (value.user) {
    collectObjectIds(value.user, bucket);
  }

  if (value._id) {
    collectObjectIds(value._id, bucket);
  }
};

const extractRoomMemberIds = (room) => {
  const memberIds = new Set();

  if (!room) {
    return [];
  }

  for (const key of ROOM_RELATION_KEYS) {
    collectObjectIds(room[key], memberIds);
  }

  return [...memberIds];
};

const toSessionPayload = (session) => ({
  sessionId: session._id.toString(),
  roomId: session.room.toString(),
  startedBy:
    typeof session.startedBy === 'object' && session.startedBy?._id
      ? session.startedBy._id.toString()
      : session.startedBy.toString(),
  type: session.type,
  status: session.status,
  duration: session.duration,
  startedAt: session.startedAt,
  endsAt: session.endsAt,
  cycle: session.cycle,
});

const ensureValidSessionType = (type) => {
  if (!['study', 'break'].includes(type)) {
    throw new AppError(
      'Session type must be either "study" or "break".',
      400,
    );
  }
};

const ensureValidDuration = (duration) => {
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new AppError('Session duration must be a positive number.', 400);
  }
};

const getAutoDuration = (type) =>
  type === 'study'
    ? DEFAULT_STUDY_DURATION_MINUTES
    : DEFAULT_BREAK_DURATION_MINUTES;

const getRoomContext = async (roomId) => {
  const Room = getRoomModel();

  if (!Room) {
    return {
      room: null,
      memberIds: [],
    };
  }

  const room = await Room.findById(roomId).lean();

  if (!room) {
    throw new AppError('Room not found.', 404);
  }

  return {
    room,
    memberIds: extractRoomMemberIds(room),
  };
};

const assertUserCanAccessRoom = (memberIds, userId) => {
  if (!memberIds.length) {
    return;
  }

  if (!memberIds.includes(userId.toString())) {
    throw new AppError(
      'You are not authorized to manage sessions in this room.',
      403,
    );
  }
};

const notifyRoomMembers = async ({
  roomId,
  sender,
  type,
  message,
  metadata,
  fallbackRecipients = [],
}) => {
  const { memberIds } = await getRoomContext(roomId);
  const recipientIds = new Set(
    (memberIds.length ? memberIds : fallbackRecipients).map((value) =>
      value.toString(),
    ),
  );

  if (!recipientIds.size) {
    return;
  }

  await Promise.all(
    [...recipientIds].map((recipient) =>
      createNotification({
        recipient,
        sender,
        type,
        message,
        metadata,
      }),
    ),
  );
};

const getLatestSessionInRoom = async (roomId) =>
  await Session.findOne({
    room: roomId,
  }).sort({
    startedAt: -1,
    createdAt: -1,
  });

const buildCycle = async (roomId, type) => {
  const latestSession = await getLatestSessionInRoom(roomId);
  const previousCycle = latestSession?.cycle || 0;

  if (type === 'study') {
    return previousCycle + 1;
  }

  return previousCycle || 1;
};

const getFallbackRecipients = (session) => {
  const recipients = new Set([session.startedBy.toString()]);

  for (const participant of session.participants || []) {
    if (participant?.user) {
      recipients.add(participant.user.toString());
    }
  }

  return [...recipients];
};

const findActiveSessionByRoom = async (roomId) =>
  await Session.findOne({
    room: roomId,
    status: 'active',
  }).sort({
    createdAt: -1,
  });

const ensureRoomSessionIsFresh = async (roomId) => {
  validateObjectId(roomId, 'room id');

  const activeSession = await findActiveSessionByRoom(roomId);

  if (!activeSession) {
    return null;
  }

  if (activeSession.endsAt > new Date()) {
    return activeSession;
  }

  await endSession(activeSession._id, {
    allowAutoFlow: true,
    endedBy: activeSession.startedBy,
    trigger: 'lazy_expiration',
  });

  return await findActiveSessionByRoom(roomId);
};

const getActiveSessionForRoom = async (roomId, currentUserId) => {
  validateObjectId(roomId, 'room id');
  validateObjectId(currentUserId, 'current user id');

  const { memberIds } = await getRoomContext(roomId);
  assertUserCanAccessRoom(memberIds, currentUserId);

  const session = await ensureRoomSessionIsFresh(roomId);

  if (!session) {
    return null;
  }

  return toSessionPayload(session);
};

const startSession = async ({
  roomId,
  startedBy,
  type,
  duration,
  skipFreshnessCheck = false,
}) => {
  validateObjectId(roomId, 'room id');
  validateObjectId(startedBy, 'started by user id');
  ensureValidSessionType(type);
  ensureValidDuration(duration);

  const { memberIds } = await getRoomContext(roomId);
  assertUserCanAccessRoom(memberIds, startedBy);

  if (!skipFreshnessCheck) {
    await ensureRoomSessionIsFresh(roomId);
  }

  const existingActiveSession = await findActiveSessionByRoom(roomId);

  if (existingActiveSession) {
    throw new AppError('This room already has an active session.', 409);
  }

  const now = new Date();
  const sessionData = {
    room: roomId,
    startedBy,
    type,
    status: 'active',
    duration,
    startedAt: now,
    endsAt: new Date(now.getTime() + duration * 60 * 1000),
    cycle: await buildCycle(roomId, type),
    participants: [
      {
        user: startedBy,
        joinedAt: now,
      },
    ],
  };

  let session;

  try {
    session = await Session.create(sessionData);
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }

    await ensureRoomSessionIsFresh(roomId);

    const retryActiveSession = await findActiveSessionByRoom(roomId);

    if (retryActiveSession) {
      throw new AppError('This room already has an active session.', 409);
    }

    session = await Session.create(sessionData);
  }

  emitSessionStarted(roomId, toSessionPayload(session));

  await notifyRoomMembers({
    roomId,
    sender: startedBy,
    type: 'session_started',
    message: `A ${type} session has started.`,
    metadata: {
      roomId: roomId.toString(),
      sessionId: session._id.toString(),
      sessionType: type,
      duration,
      cycle: session.cycle,
    },
    fallbackRecipients: getFallbackRecipients(session),
  });

  return session;
};

const endSession = async (
  sessionId,
  { endedBy = null, allowAutoFlow = true, trigger = 'manual' } = {},
) => {
  validateObjectId(sessionId, 'session id');

  const existingSession = await Session.findById(sessionId);

  if (!existingSession) {
    throw new AppError('Session not found.', 404);
  }

  if (endedBy) {
    validateObjectId(endedBy, 'ended by user id');
    const { memberIds } = await getRoomContext(existingSession.room);

    if (memberIds.length) {
      assertUserCanAccessRoom(memberIds, endedBy);
    }
  }

  const session = await Session.findOneAndUpdate(
    {
      _id: sessionId,
      status: 'active',
    },
    {
      $set: {
        status: 'ended',
      },
    },
    {
      new: true,
    },
  );

  if (!session) {
    return {
      session: existingSession,
      autoStartedSession: null,
      ended: false,
    };
  }

  emitSessionEnded(session.room, toSessionPayload(session));

  await notifyRoomMembers({
    roomId: session.room,
    sender: endedBy || session.startedBy,
    type: 'session_finished',
    message: `The ${session.type} session has ended.`,
    metadata: {
      roomId: session.room.toString(),
      sessionId: session._id.toString(),
      sessionType: session.type,
      duration: session.duration,
      cycle: session.cycle,
      trigger,
    },
    fallbackRecipients: getFallbackRecipients(session),
  });

  let autoStartedSession = null;

  if (allowAutoFlow) {
    const nextType = session.type === 'study' ? 'break' : 'study';
    const nextStartedBy = endedBy || session.startedBy;

    try {
      autoStartedSession = await startSession({
        roomId: session.room,
        startedBy: nextStartedBy,
        type: nextType,
        duration: getAutoDuration(nextType),
        skipFreshnessCheck: true,
      });
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 409) {
        autoStartedSession = null;
      } else {
        throw error;
      }
    }
  }

  return {
    session,
    autoStartedSession,
    ended: true,
  };
};

const syncUserActiveSessionsOnConnection = async (userId) => {
  validateObjectId(userId, 'user id');

  const now = new Date();
  const expiredSessions = await Session.find({
    status: 'active',
    endsAt: { $lte: now },
    $or: [{ startedBy: userId }, { 'participants.user': userId }],
  }).sort({
    endsAt: 1,
  });

  for (const session of expiredSessions) {
    await endSession(session._id, {
      endedBy: userId,
      allowAutoFlow: true,
      trigger: 'socket_connection',
    });
  }
};

const getStudyStats = async (userId) => {
  validateObjectId(userId, 'user id');

  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;

  const currentWeekStart = new Date(now);
  currentWeekStart.setHours(0, 0, 0, 0);
  currentWeekStart.setDate(currentWeekStart.getDate() - diffToMonday);

  const lastWeekStart = new Date(currentWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const nextWeekStart = new Date(currentWeekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);

  const totals = await Session.aggregate([
    {
      $match: {
        type: 'study',
        status: 'ended',
        endsAt: {
          $gte: lastWeekStart,
          $lt: nextWeekStart,
        },
        'participants.user': new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: {
          $cond: [
            {
              $gte: ['$endsAt', currentWeekStart],
            },
            'current',
            'previous',
          ],
        },
        totalMinutes: {
          $sum: '$duration',
        },
      },
    },
  ]);

  const currentMinutes =
    totals.find((item) => item._id === 'current')?.totalMinutes || 0;
  const previousMinutes =
    totals.find((item) => item._id === 'previous')?.totalMinutes || 0;

  let percentageChange = 0;

  if (previousMinutes === 0 && currentMinutes > 0) {
    percentageChange = 100;
  } else if (previousMinutes > 0) {
    percentageChange =
      ((currentMinutes - previousMinutes) / previousMinutes) * 100;
  }

  return {
    totalHours: Number((currentMinutes / 60).toFixed(2)),
    percentageChange: Number(percentageChange.toFixed(2)),
  };
};

export {
  ensureRoomSessionIsFresh,
  getActiveSessionForRoom,
  startSession,
  endSession,
  syncUserActiveSessionsOnConnection,
  getStudyStats,
};
