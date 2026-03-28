import express from 'express';
import * as authMiddleware from '../../middlewares/auth.middleware.js';
import * as sessionController from './session.controller.js';

const sessionRouter = express.Router();

sessionRouter.use(authMiddleware.isAuthenticated);

sessionRouter.get('/room/:roomId/active', sessionController.getActiveSessionForRoom);
sessionRouter.post('/start', sessionController.startSession);
sessionRouter.patch('/:id/end', sessionController.endSession);
sessionRouter.get('/stats/me', sessionController.getStudyStats);

export default sessionRouter;
