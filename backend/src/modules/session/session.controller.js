import catchAsync from '../../utils/error/catchAsync.js';
import * as sessionService from './session.service.js';

const getActiveSessionForRoom = catchAsync(async (req, res) => {
  const session = await sessionService.getActiveSessionForRoom(
    req.params.roomId,
    req.user._id,
  );

  res.status(200).json({
    status: 'success',
    data: {
      session,
    },
  });
});

const startSession = catchAsync(async (req, res) => {
  const session = await sessionService.startSession({
    roomId: req.body.roomId,
    startedBy: req.user._id,
    type: req.body.type,
    duration: Number(req.body.duration),
  });

  res.status(201).json({
    status: 'success',
    message: 'Session started successfully.',
    data: {
      session,
    },
  });
});

const endSession = catchAsync(async (req, res) => {
  const result = await sessionService.endSession(req.params.id, {
    endedBy: req.user._id,
    allowAutoFlow: true,
    trigger: 'api',
  });

  res.status(200).json({
    status: 'success',
    message: result.ended
      ? 'Session ended successfully.'
      : 'Session was already ended.',
    data: {
      session: result.session,
      autoStartedSession: result.autoStartedSession,
    },
  });
});

const getStudyStats = catchAsync(async (req, res) => {
  const stats = await sessionService.getStudyStats(req.user._id);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

export {
  getActiveSessionForRoom,
  startSession,
  endSession,
  getStudyStats,
};
