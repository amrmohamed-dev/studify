import * as roomService from './room.service.js';

export const createRoom = async (req, res, next) => {
  try {
    const room = await roomService.createRoom({
      ...req.body,
      owner: req.user._id,
    });
    res.status(201).json({ status: 'success', data: room });
  } catch (error) {
    next(error);
  }
};


export const getRoom = async (req, res, next) => {
  try {
    const room = await roomService.getRoomById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.status(200).json({ status: 'success', data: room });
  } catch (error) {
    next(error);
  }
};

export const getAllRooms = async (req, res, next) => {
  try {
    const rooms = await roomService.getAllRooms(req.query.search);
    res.status(200).json({ status: 'success', data: rooms });
  } catch (error) {
    next(error);
  }
};


export const updateRoom = async (req, res, next) => {
  try {
    const room = await roomService.updateRoom(req.params.id, req.body);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.status(200).json({ status: 'success', data: room });
  } catch (error) {
    next(error);
  }
};


export const deleteRoom = async (req, res, next) => {
  try {
    await roomService.deleteRoom(req.params.id);
    res.status(204).json({ status: 'success' });
  } catch (error) {
    next(error);
  }
};