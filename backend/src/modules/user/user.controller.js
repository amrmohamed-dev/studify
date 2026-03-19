import User from './user.model.js';
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
    .filter();

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
  deleteMe,
  addProfilePhoto,
  deleteProfilePhoto,
  getAllUsers,
};
