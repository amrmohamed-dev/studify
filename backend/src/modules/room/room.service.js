import Room from './room.model.js';

export const createRoom = async (data) => {
  const room = await Room.create(data);
  return room;
};


export const getRoomById = async (id) => {
  const room = await Room.findById(id);
  return room;
};


export const getAllRooms = async (search) => {
  const query = search
    ? { name: { $regex: search, $options: 'i' } }
    : {};
  const rooms = await Room.find(query);
  return rooms;
};


export const updateRoom = async (id, data) => {
  const room = await Room.findByIdAndUpdate(id, data, { new: true });
  return room;
};


export const deleteRoom = async (id) => {
  await Room.findByIdAndDelete(id);
};