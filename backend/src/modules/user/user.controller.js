import User from './user.model.js';
import Room from '../room/room.model.js';
import * as cloudinaryService from '../../services/cloudinary.service.js';
import APIFeatures from '../../utils/apiFeatures.js';
import catchAsync from '../../utils/error/catchAsync.js';
import AppError from '../../utils/error/appError.js';

const getMe = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
};

const updateMe = catchAsync(async (req, res, next) => {
  const { _id } = req.user;
  const { name } = req.body;

  const user = await User.findById(_id);

  if (name) user.name = name;

  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

const getMyFavourites = catchAsync(async (req, res, next) => {
  const { _id } = req.user;
  const user = await User.findById(_id)
    .select('favouriteRooms')
    .populate('favouriteRooms.room');

  user.favouriteRooms.sort((a, b) => b.addedAt - a.addedAt);

  res.status(200).json({
    status: 'success',
    data: {
      favouriteRooms: user.favouriteRooms,
    },
  });
});

const toggleFavourite = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { roomId } = req.params;

  const room = await Room.findById(roomId);

  if (!room) {
    return next(new AppError('No Room found with that ID', 404));
  }

  const favIndex = user.favouriteRooms.findIndex((fav) =>
    fav.room.equals(roomId),
  );

  let action;

  if (favIndex !== -1) {
    action = 'removed from';
    user.favouriteRooms.splice(favIndex, 1);
  } else {
    action = 'added to';
    user.favouriteRooms.push({ room: roomId });
  }

  await user.save({ validateModifiedOnly: true });

  const populatedUser = await User.findById(user._id)
    .select('favouriteRooms')
    .populate('favouriteRooms.room');

  res.status(200).json({
    status: 'success',
    message: `Room ${action} favourites`,
    data: {
      favouriteRooms: populatedUser.favouriteRooms,
    },
  });
});

const deleteMe = catchAsync(async (req, res, next) => {
  const { _id } = req.user;

  const user = await User.findById(_id);

  if (user.image?.publicId) {
    await cloudinaryService.deleteFromCloudinary(user.image.publicId);
  }

  await user.deleteOne();

  res.status(204).send();
});

const addProfilePhoto = catchAsync(async (req, res, next) => {
  if (!req.file)
    return next(new AppError('Profile image is required', 400));

  const { _id } = req.user;

  const user = await User.findById(_id);

  const uploadResult = await cloudinaryService.uploadToCloudinary(
    req.file.buffer,
    'users',
  );

  const oldPublicId = user.image?.publicId;

  user.image = {
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
  };

  await user.save({ validateModifiedOnly: true });

  if (oldPublicId) {
    await cloudinaryService.deleteFromCloudinary(oldPublicId);
  }

  res.status(200).json({
    status: 'success',
    message: 'Profile photo uploaded successfully',
    data: {
      user,
    },
  });
});

const deleteProfilePhoto = catchAsync(async (req, res, next) => {
  const { _id } = req.user;

  const user = await User.findById(_id);

  if (!user.image?.publicId)
    return next(new AppError('No profile photo to delete', 400));

  await cloudinaryService.deleteFromCloudinary(user.image?.publicId);

  user.image = {
    url: null,
    publicId: null,
  };

  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    status: 'success',
    message: 'Profile photo deleted successfully',
    data: {
      user,
    },
  });
});

const getAllUsers = catchAsync(async (req, res, next) => {
 const features = new APIFeatures(
  User.find({
    _id: { $ne: req.user._id },
  }),
  req.query,
)
  .search()
  .filter(['role']);

  const countQuery = features.mongooseQuery.clone();
  const total = await countQuery.countDocuments();

  features.sort().select().paginate();
  const users = await features.mongooseQuery;

  const totalPages = Math.ceil(total / features.limit);

  res.status(200).json({
    status: 'success',
    meta: {
      total,
      results: users.length,
      totalPages,
      page: features.page,
      hasNext: features.page < totalPages,
      hasPrev: features.page > 1,
    },
    data: {
      users,
    },
  });
});

export {
  getMe,
  updateMe,
  getMyFavourites,
  toggleFavourite,
  deleteMe,
  addProfilePhoto,
  deleteProfilePhoto,
  getAllUsers,
};
