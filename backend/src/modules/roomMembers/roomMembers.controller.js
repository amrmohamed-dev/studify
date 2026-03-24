import * as roomService from "./roomMembers.service.js";
import catchAsync from "../../utils/catchAsync.js";

export const joinRoom = catchAsync(async (req, res) => {
  const result = await roomService.joinRoom(
    req.user._id,
    req.params.id
  );

  res.status(200).json(result);
});

export const approveMember = catchAsync(async (req, res) => {
  const result = await roomService.approveMember(
    req.user._id,
    req.params.id,
    req.params.userId
  );

  res.status(200).json(result);
});

export const removeMember = catchAsync(async (req, res) => {
  const result = await roomService.removeMember(
    req.user._id,
    req.params.id,
    req.params.userId
  );

  res.status(200).json(result);
});

export const getMembers = catchAsync(async (req, res) => {
  const result = await roomService.getMembers(req.params.id);
  res.status(200).json(result);
});

export const getPending = catchAsync(async (req, res) => {
  const result = await roomService.getPending(req.params.id);
  res.status(200).json(result);
});