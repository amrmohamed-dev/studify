import Task from './task.model.js';
import catchAsync from '../../utils/error/catchAsync.js';
import AppError from '../../utils/error/appError.js';
import APIFeatures from '../../utils/apiFeatures.js';
export const createTask = catchAsync(async (req, res, next) => {
  const { title } = req.body;
  const { roomId } = req.params;

  const task = await Task.create({
    title,
    room: roomId,
    createdBy: req.user._id,
  });

  res.status(201).json({
    status: 'success',
    message: 'Task created successfully',
    data: { task: { ...task.toJSON(), doneCount: task.doneCount } },
  });
});

export const getRoomTasks = catchAsync(async (req, res, next) => {
  const { roomId } = req.params;

  let query = Task.find({ room: roomId })
    .populate('createdBy', 'name')
    .populate('doneBy.user', 'name');

  const features = new APIFeatures(query, req.query)
    .search()
    .filter()
    .sort()
    .select()
    .paginate();

  const tasks = await features.mongooseQuery;

  const tasksWithDoneCount = tasks.map(task => ({
    ...task.toJSON(),
    doneCount: task.doneCount,
  }));

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    page: features.page,
    limit: features.limit,
    data: { tasks: tasksWithDoneCount },
  });
});

export const getTaskById = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate('createdBy', 'name')
    .populate('doneBy.user', 'name');

  if (!task) return next(new AppError('Task not found', 404));

  res.status(200).json({
    status: 'success',
    data: { task: { ...task.toJSON(), doneCount: task.doneCount } },
  });
});

export const toggleTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) return next(new AppError('Task not found', 404));

  const userId = req.user._id.toString();
  const alreadyDone = task.doneBy.find(d => d.user.toString() === userId);

  if (alreadyDone) {
    task.doneBy = task.doneBy.filter(d => d.user.toString() !== userId);
  } else {
    task.doneBy.push({ user: req.user._id });
  }

  await task.save();

  res.status(200).json({
    status: 'success',
    message: 'Task toggled successfully',
    data: { task: { ...task.toJSON(), doneCount: task.doneCount } },
  });
});

export const updateTask = catchAsync(async (req, res, next) => {
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { title: req.body.title },
    { new: true, runValidators: true }
  );

  if (!task) return next(new AppError('Task not found', 404));

  res.status(200).json({
    status: 'success',
    message: 'Task updated successfully',
    data: { task: { ...task.toJSON(), doneCount: task.doneCount } },
  });
});

export const deleteTask = catchAsync(async (req, res, next) => {
  const task = await Task.findByIdAndDelete(req.params.id);

  if (!task) return next(new AppError('Task not found', 404));

  res.status(204).send();
});