import express from 'express';
import { ValidationChain, param, validationResult } from 'express-validator';
import { BadRequestError } from '../../infrastructure/errors';
import HealthService from './healthService';
import { authorizationHandler, roleBasedAuthorization } from '../../infrastructure/authentication';
import { wrapChain } from '../../helpers/wrapChain';
import { UserRole } from '../../typings/userRole';

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

router.get('/helloUser/:name', authorizationHandler,
    async (req: express.Request, res: express.Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new BadRequestError(JSON.stringify(errors));
        }
        console.error(req.user);
        res.send(healthService.sayHello(req.user!.name + req.user?.id.toString()));
});

router.get('/helloAdmin/:name', roleBasedAuthorization(UserRole.Admin),
    async (req: express.Request, res: express.Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new BadRequestError(JSON.stringify(errors));
        }

        res.send(healthService.sayHello(req.user!.name));
});

export default router;