import Notification from './notification.model.js';
import APIFeatures from '../../utils/apiFeatures.js';
import catchAsync from '../../utils/error/catchAsync.js';
import AppError from '../../utils/error/appError.js';

const getNotifications = catchAsync(async (req, res) => {
  const featuresQuery = {
    ...req.query,
    searchFields: 'message,type,link',
  };

  const features = new APIFeatures(
  Notification.find({
    recipient: req.user._id,
  })
    .populate('sender', 'name email image')
    .populate('recipient', 'name email image'),
  featuresQuery,
)
  .search()
  .filter(['type', 'isRead']);

  const countQuery = features.mongooseQuery.clone();
  const total = await countQuery.countDocuments();

  features.sort().select().paginate();
  const notifications = await features.mongooseQuery;
  const totalPages = Math.ceil(total / features.limit);

  res.status(200).json({
    status: 'success',
    meta: {
      total,
      results: notifications.length,
      totalPages,
      page: features.page,
      hasNext: features.page < totalPages,
      hasPrev: features.page > 1,
    },
    data: {
      notifications,
    },
  });
});

const markNotificationAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id,
  })
    .populate('sender', 'name email image')
    .populate('recipient', 'name email image');

  if (!notification) {
    return next(new AppError('Notification not found.', 404));
  }

  notification.isRead = true;
  await notification.save({ validateModifiedOnly: true });

  res.status(200).json({
    status: 'success',
    message: 'Notification marked as read successfully.',
    data: {
      notification,
    },
  });
});

const markAllNotificationsAsRead = catchAsync(async (req, res) => {
  await Notification.updateMany(
    {
      recipient: req.user._id,
      isRead: false,
    },
    {
      isRead: true,
    },
  );

  res.status(200).json({
    status: 'success',
    message: 'All notifications marked as read successfully.',
  });
});

export {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
