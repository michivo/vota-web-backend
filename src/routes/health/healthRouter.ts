import express from 'express';
import { ValidationChain, param, validationResult } from 'express-validator';
import { BadRequestError } from '../../infrastructure/errors';
import HealthService from './healthService';
import { authorizationHandler, roleBasedAuthorization } from '../../infrastructure/authentication';

const router = express.Router();
const healthService = new HealthService();

const validation: ValidationChain = param('name').isAlpha().notEmpty();
const validationMiddleware = (req: express.Request, res: express.Response, next: (error?: any) => void) => Promise.resolve(validation(req, res, next));

router.get('/hello/:name', validationMiddleware,
    async (req: express.Request, res: express.Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new BadRequestError(JSON.stringify(errors));
        }

        res.send(healthService.sayHello(req.params.name));
});

router.get('/helloUser/:name', authorizationHandler, validationMiddleware,
    async (req: express.Request, res: express.Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new BadRequestError(JSON.stringify(errors));
        }

        res.send(healthService.sayHello(req.params.name));
});

router.get('/helloAdmin/:name', roleBasedAuthorization('admin'), validationMiddleware,
    async (req: express.Request, res: express.Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new BadRequestError(JSON.stringify(errors));
        }

        res.send(healthService.sayHello(req.params.name));
});

export default router;