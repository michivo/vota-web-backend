import * as express from 'express';

import healthRouter from './routes/health/healthRouter';
import userRouter from './routes/users/userRouter';

const router = express.Router({ mergeParams: true });

router.use('/api/v1/health', healthRouter);
router.use('/api/v1/user', userRouter);

export default router;
