import Room from './room.model.js';
import APIFeatures from '../../utils/apiFeatures.js';
import * as cloudinaryService from '../../services/cloudinary.service.js';
import { emitToRoom } from '../../sockets/utils/emit.js';
import SOCKET_EVENTS from '../../sockets/constants.js';

const createRoom = async ({ userId, data, file }) => {
  let imageData = { url: null, publicId: null };

  if (file) {
    const uploadResult = await cloudinaryService.uploadToCloudinary(
      file.buffer,
      'rooms',
    );

    imageData = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    };
  }

  const room = await Room.create({
    ...data,
    image: imageData,
    createdBy: userId,
  });

  return room;
};

const getRoomById = async (id) => {
  const room = await Room.findById(id)
    .populate('createdBy', 'name image')
    .populate('members.user', 'name image')
    .populate('pendingMembers.user', 'name image');
  return room;
};

const getAllRooms = async (query) => {
  const normalizedQuery = { ...query };
  let mongooseQuery = Room.find();

  if (normalizedQuery['members.user']) {
    const userId = normalizedQuery['members.user'];

    mongooseQuery = Room.find({
      $or: [{ createdBy: userId }, { 'members.user': userId }],
    });

    delete normalizedQuery['members.user'];
  }

  const features = new APIFeatures(mongooseQuery, normalizedQuery)
    .search()
    .filter();

  const countQuery = features.mongooseQuery.clone();

  const total = await Room.countDocuments(countQuery.getFilter());

  features.sort().select().paginate();

  const rooms = await features.mongooseQuery.populate(
    'createdBy',
    'name image',
  );

  const page = features.page || 1;
  const limit = features.limit || 10;

  const totalPages = Math.ceil(total / limit);

  return {
    rooms,
    meta: {
      total,
      results: rooms.length,
      totalPages,
      page,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

const updateRoom = async ({ room, data, file }) => {
  if (data.name) room.name = data.name;
  if (data.privacyType) room.privacyType = data.privacyType;
  if (data.password) room.password = data.password;
  if (
    data.maxMembers &&
    typeof +data.maxMembers === 'number' &&
    room.members.length <= data.maxMembers
  )
    room.maxMembers = data.maxMembers;

  if (file) {
    const upload = await cloudinaryService.uploadToCloudinary(
      file.buffer,
      'rooms',
    );

    const oldPublicId = room.image?.publicId;

    room.image = {
      url: upload.secure_url,
      publicId: upload.public_id,
    };

    if (oldPublicId) {
      await cloudinaryService.deleteFromCloudinary(oldPublicId);
    }
  }

  await room.save({ validateModifiedOnly: true });

  emitToRoom(room._id, SOCKET_EVENTS.ROOM_UPDATED, { room });

  return room;
};

const deleteRoom = async (room) => {
  if (room.image?.publicId) {
    await cloudinaryService.deleteFromCloudinary(room.image.publicId);
  }

  await room.deleteOne();
};

export { createRoom, getRoomById, getAllRooms, updateRoom, deleteRoom };
