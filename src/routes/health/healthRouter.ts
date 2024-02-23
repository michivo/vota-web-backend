import express, { NextFunction } from 'express';
import { ValidationChain, param, validationResult } from 'express-validator';
import { BadRequestError } from '../../infrastructure/errors';
import HealthService from './healthService';
import { authorizationHandler, roleBasedAuthorization } from '../../infrastructure/authentication';
import { UserRole } from '../../typings/userRole';
import { testVota } from '../../infrastructure/vota';

const router = express.Router();
const healthService = new HealthService();

const validation: ValidationChain = param('name').isAlpha().notEmpty().isLength({ min: 1, max: 100 });

router.get('/hello/:name', validation,
    async (req: express.Request, res: express.Response, error: NextFunction) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new BadRequestError(JSON.stringify(errors));
            }

            res.send(healthService.sayHello(req.params.name));
        }
        catch (err) {
            error(err);
        }
    });

router.get('/helloDb/:name', validation,
    async (req: express.Request, res: express.Response, error: NextFunction) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new BadRequestError(JSON.stringify(errors));
            }

            res.send(await healthService.sayHelloWithDbCheck(req.params.name));
        }
        catch (err) {
            error(err);
        }
    });

router.get('/helloUser/:name', authorizationHandler,
    async (req: express.Request, res: express.Response, error: NextFunction) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new BadRequestError(JSON.stringify(errors));
            }
            console.error(req.user);
            res.send(healthService.sayHello(req.user!.name + req.user?.id.toString()));
        }
        catch (err) {
            error(err);
        }
    });

router.get('/helloAdmin/:name', roleBasedAuthorization(UserRole.Admin),
    async (req: express.Request, res: express.Response, error: NextFunction) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new BadRequestError(JSON.stringify(errors));
            }

            res.send(healthService.sayHello(req.user!.name));
        }
        catch (err) {
            error(err);
        }
    });

router.get('/helloVota', async (_req: express.Request, res: express.Response, error: NextFunction) => {
    try {
        const response = await testVota();
        res.send(response);
    }
    catch (err) {
        error(err);
    }
});

export default router;