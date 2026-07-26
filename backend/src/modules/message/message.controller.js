import { messageModel } from './message.model.js';
import catchAsync from '../../utils/error/catchAsync.js';
import AppError from '../../utils/error/appError.js';
import APIFeatures from '../../utils/apiFeatures.js';

export const getMessagesByRoomId = catchAsync(async (req, res, next) => {
  const { roomId } = req.params;

  let query = messageModel
    .find({ room: roomId })
    .populate('sender', 'name')
    .populate('room', 'name');

  const features = new APIFeatures(query, req.query)
  .search()
  .filter([])
  .sort()
  .select()
  .paginate();

  const messages = await features.mongooseQuery;

  res.status(200).json({
    status: 'success',
    results: messages.length,
    page: features.page,
    limit: features.limit,
    data: { messages },
  });
});