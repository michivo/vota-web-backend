import * as express from 'express';

import healthRouter from './routes/health/healthRouter';
import { decorateRouter } from '@awaitjs/express';
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from './infrastructure/errors';

function errorHandler (err: Error, _: express.Request, res: express.Response, next: express.NextFunction) {
    console.log('Error processing request');
    console.error(err);
    if (res.headersSent) {
      return next(err);
    }
    switch (err.constructor) {
        case BadRequestError:
            return res.status(400).send(err.message);
        case UnauthorizedError:
            return res.status(401).send(err.message);
        case ForbiddenError:
            return res.status(403).send(err.message);
        case NotFoundError:
            return res.status(404).send(err.message);
        default:
            break;
    }
    res.status(500);
    res.send(err);
  }

const router = decorateRouter(express.Router({ mergeParams: true }));

router.use('/api/v1/health', healthRouter);

router.use(errorHandler);

export default router;
