import path from 'path';
import { existsSync } from 'fs';
import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import AppError from './src/utils/error/appError.js';
import globalErrorHandler from './src/middlewares/globalErrorHandler.js';
import authRouter from './src/modules/auth/auth.route.js';
import userRouter from './src/modules/user/user.route.js';
import taskRouter from './src/modules/task/task.route.js';
import messageRouter from './src/modules/message/message.route.js';


const app = express();

app.enable('trust proxy');

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.disable('x-powered-by');

app.use(cookieParser());
app.use(express.json({ limit: '5kb' }));

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1', taskRouter);
app.use('/api/v1', messageRouter);

const angularDistPath = path.join(
  process.cwd(),
  '..',
  'frontend',
  'dist',
  'frontend',
  'browser',
);
const angularIndexPath = path.join(angularDistPath, 'index.html');
if (existsSync(angularIndexPath)) {
  app.use(express.static(angularDistPath));

  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(angularIndexPath);
  });
}

app.use((req, res, next) => {
  next(
    new AppError(
      `Can't find this route '${req.originalUrl}' on this server!`,
      404,
    ),
  );
});

app.use(globalErrorHandler);

export default app;