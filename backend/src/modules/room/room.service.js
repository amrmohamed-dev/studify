import Room from './room.model.js';
import APIFeatures from '../../utils/apiFeatures.js';

const createRoom = async (data) => {
  const room = await Room.create(data);
  return room;
};

const getRoomById = async (id) => {
  const room = await Room.findById(id);
  return room;
};

const getAllRooms = async (query) => {
  const features = new APIFeatures(Room.find(), query)
    .search()
    .filter()
    .sort()
    .select()
    .paginate();
  const rooms = await features.mongooseQuery;
  return rooms;
};

const updateRoom = async (id, data) => {
  const room = await Room.findByIdAndUpdate(id, data, { new: true });
  return room;
};

const deleteRoom = async (id) => {
  await Room.findByIdAndDelete(id);
};

export { createRoom, getRoomById, getAllRooms, updateRoom, deleteRoom };