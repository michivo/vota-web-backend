import express from 'express';
import { ValidationChain, param, validationResult } from 'express-validator';
import { BadRequestError } from '../../infrastructure/errors';
import HealthService from './healthService';
import { authorizationHandler, roleBasedAuthorization } from '../../infrastructure/authentication';
import { wrapChain } from '../../helpers/wrapChain';

const router = express.Router();
const healthService = new HealthService();

const validation: ValidationChain = param('name').isAlpha().notEmpty().isLength({ min: 1, max: 100 });

router.get('/hello/:name', wrapChain(validation),
    async (req: express.Request, res: express.Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new BadRequestError(JSON.stringify(errors));
        }

        res.send(healthService.sayHello(req.params.name));
});

router.get('/helloDb/:name', wrapChain(validation),
    async (req: express.Request, res: express.Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new BadRequestError(JSON.stringify(errors));
        }

        res.send(await healthService.sayHelloWithDbCheck(req.params.name));
});

router.get('/helloUser/:name', authorizationHandler, wrapChain(validation),
    async (req: express.Request, res: express.Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new BadRequestError(JSON.stringify(errors));
        }

        res.send(healthService.sayHello(req.params.name));
});

router.get('/helloAdmin/:name', roleBasedAuthorization('admin'), wrapChain(validation),
    async (req: express.Request, res: express.Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new BadRequestError(JSON.stringify(errors));
        }

        res.send(healthService.sayHello(req.params.name));
});

export default router;