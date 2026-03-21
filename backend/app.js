import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import AppError from './src/utils/error/appError.js';
import globalErrorHandler from './src/middlewares/globalErrorHandler.js';
import authRouter from './src/modules/auth/auth.route.js';
import userRouter from './src/modules/user/user.route.js';
import roomRouter from './src/modules/rooms/room.router.js';

const app = express();

app.enable('trust proxy');

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.disable('x-powered-by');

app.use(cookieParser());
app.use(express.json({ limit: '5kb' }));

//Rooters
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/rooms', roomRouter);

app.use((req, res, next) => {
  next(
    new AppError(
      `Can't find this route '${req.originalUrl}' on this server!`,
      404,
    ),
  );
});

app.use(globalErrorHandler);

export default app;ر