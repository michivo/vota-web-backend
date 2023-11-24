import * as express from 'express';

import healthRouter from './routes/health/healthRouter';
import userRouter from './routes/users/userRouter';
import electionRouter from './routes/elections/electionRouter';
import ballotRouter from './routes/ballots/ballotRouter';

const router = express.Router({ mergeParams: true });

router.use('/api/v1/health', healthRouter);
router.use('/api/v1/users', userRouter);
router.use('/api/v1/elections', electionRouter);
router.use('/api/v1/ballots', ballotRouter);

export default router;
