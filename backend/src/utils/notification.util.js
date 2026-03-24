import Notification from '../modules/notification/notification.model.js';
import { emitToUser } from '../sockets/utils/emit.js';
import SOCKET_EVENTS from '../sockets/constants.js';

const createNotification = async ({
  recipient,
  sender = null,
  type,
  message = null,
  link = null,
  metadata = {},
}) => {
  const notification = await Notification.create({
    recipient,
    sender,
    type,
    message,
    link,
    metadata,
  });

  const populatedNotification = await Notification.findById(
    notification._id,
  )
    .populate('sender', 'name email image')
    .populate('recipient', 'name email image');

  const payload = {
    notification: populatedNotification,
  };

  emitToUser(recipient, SOCKET_EVENTS.NOTIFICATION_NEW, payload);

  return populatedNotification;
};

export default createNotification;
