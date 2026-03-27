import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import User from '../../modules/user/user.model.js';

const parseCookies = (cookieHeader = '') =>
  cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce((acc, cookie) => {
      const index = cookie.indexOf('=');

      if (index === -1) return acc;

      const key = cookie.slice(0, index);
      const value = cookie.slice(index + 1);

      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});

const getSocketToken = (socket) =>
  socket.handshake.auth?.token ||
  parseCookies(socket.handshake.headers.cookie).jwt;

const socketAuth = async (socket, next) => {
  try {
    const token = getSocketToken(socket);

    if (!token) {
      return next(new Error('Authentication failed.'));
    }

    const decoded = await promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET,
    );
    const user = await User.findById(decoded.userId);

    if (!user || user.changedPasswordAfter(decoded.iat)) {
      return next(new Error('Authentication failed.'));
    }

    socket.data.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
    };

    next();
  } catch (error) {
    next(new Error('Authentication failed.'));
  }
};

export default socketAuth;
