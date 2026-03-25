import * as roomService from './room.service.js';
import catchAsync from '../../utils/error/catchAsync.js';
import AppError from '../../utils/error/appError.js';

const createRoom = catchAsync(async (req, res, next) => {
  const room = await roomService.createRoom({
    ...req.body,
    createdBy: req.user._id,
  });
  res.status(201).json({ status: 'success', data: { room } });
});

const getRoom = catchAsync(async (req, res, next) => {
  const room = await roomService.getRoomById(req.params.id);
  if (!room) return next(new AppError('Room not found', 404));
  res.status(200).json({ status: 'success', data: { room } });
});

const getAllRooms = catchAsync(async (req, res, next) => {
  const rooms = await roomService.getAllRooms(req.query);
  res.status(200).json({ status: 'success', data: { rooms } });
});

const updateRoom = catchAsync(async (req, res, next) => {
  const room = await roomService.updateRoom(req.params.id, req.body);
  if (!room) return next(new AppError('Room not found', 404));
  res.status(200).json({ status: 'success', data: { room } });
});

const deleteRoom = catchAsync(async (req, res, next) => {
  await roomService.deleteRoom(req.params.id);
  res.status(204).send();
});

export { createRoom, getRoom, getAllRooms, updateRoom, deleteRoom };