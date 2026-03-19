import User from './user.model.js';
import catchAsync from '../../utils/error/catchAsync.js';
import APIFeatures from '../../utils/apiFeatures.js';

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

  await user.deleteOne();

  res.status(204).send();
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

export { getMe, updateMe, deleteMe, getAllUsers };
