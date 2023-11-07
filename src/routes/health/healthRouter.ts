import express from 'express';
import { decorateRouter } from '@awaitjs/express';
import { ValidationChain, param, validationResult } from 'express-validator';
import { BadRequestError } from '../../infrastructure/errors';
import HealthService from './healthService';

const router = decorateRouter(express.Router());
const healthService = new HealthService();

const validation: ValidationChain = param('name').isAlpha().notEmpty();
const validationMiddleware = (req: express.Request, res: express.Response, next: (error?: any) => void) => Promise.resolve(validation(req, res, next));

router.getAsync('/hello/:name', validationMiddleware,
    async (req: express.Request, res: express.Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new BadRequestError(JSON.stringify(errors));
        }

        res.send(healthService.sayHello(req.params.name));
});


export default router;