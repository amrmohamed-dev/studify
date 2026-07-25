import Room from '../modules/room/room.model.js';
import Task from '../modules/task/task.model.js';
import AppError from '../utils/error/appError.js';
import catchAsync from '../utils/error/catchAsync.js';
import validateObjectId from '../utils/validateObjectId.js';

const isRoomMember = (room, userId) => {
  if (room.createdBy.equals(userId)) return true;
  return room.members.some((member) => member.user.equals(userId));
};

// Use on routes like /rooms/:roomId/... where roomId is directly in params
const ensureRoomMember = catchAsync(async (req, res, next) => {
  const { roomId } = req.params;
  validateObjectId(roomId, 'room id');

  const room = await Room.findById(roomId);
  if (!room) return next(new AppError('Room not found.', 404));

  if (!isRoomMember(room, req.user._id)) {
    return next(
      new AppError('You are not a member of this room.', 403),
    );
  }

  req.room = room;
  next();
});

// Use on routes like /tasks/:id where we only have the task id,
// so we look the task up first, then check membership on its room.
const ensureTaskRoomMember = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  validateObjectId(id, 'task id');

  const task = await Task.findById(id);
  if (!task) return next(new AppError('Task not found', 404));

  const room = await Room.findById(task.room);
  if (!room) return next(new AppError('Room not found.', 404));

  if (!isRoomMember(room, req.user._id)) {
    return next(
      new AppError('You are not a member of this room.', 403),
    );
  }

  req.task = task;
  next();
});

export { ensureRoomMember, ensureTaskRoomMember };
