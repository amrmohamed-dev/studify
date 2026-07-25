import * as roomService from './room.service.js';
import catchAsync from '../../utils/error/catchAsync.js';
import AppError from '../../utils/error/appError.js';
import Room from './room.model.js';

const createRoom = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const { name, privacyType, password, maxMembers } = req.body;

  const room = await roomService.createRoom({
    userId,
    data: { name, privacyType, password, maxMembers },
    file: req.file,
  });

  res.status(201).json({
    status: 'success',
    data: { room },
  });
});

const getOneRoom = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const room = await roomService.getRoomById(id);
  if (!room) return next(new AppError('Room not found', 404));

  res.status(200).json({
    status: 'success',
    data: { room },
  });
});

const getAllRooms = catchAsync(async (req, res, next) => {
  const query = { ...req.query };

  if (query.members) {
    query.$or = [
      { 'members.user': query.members },
      { createdBy: query.members },
    ];
    delete query.members;
  }

  const { rooms, meta } = await roomService.getAllRooms(query);

  res.status(200).json({
    status: 'success',
    meta,
    data: { rooms },
  });
});

const updateRoom = catchAsync(async (req, res, next) => {
  const room = await Room.findById(req.params.id).select('+password');

  if (!room) return next(new AppError('Room not found', 404));

  const userId = req.user._id;
  if (!room.createdBy.equals(userId)) {
    return next(new AppError('Not authorized', 403));
  }

  const updatedRoom = await roomService.updateRoom({
    room,
    data: req.body,
    file: req.file,
  });

  res.status(200).json({
    status: 'success',
    data: { room: updatedRoom },
  });
});

const deleteRoom = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;

  const room = await Room.findById(id);

  if (!room) return next(new AppError('Room not found', 404));

  if (!room.createdBy.equals(userId)) {
    return next(new AppError('Not authorized', 403));
  }

  await roomService.deleteRoom(room);

  res.status(204).send();
});

export { createRoom, getOneRoom, getAllRooms, updateRoom, deleteRoom };
