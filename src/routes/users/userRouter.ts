import express, { NextFunction } from 'express';
import UserService from './userService';
import { SignInRequest } from '../../typings/dtos/signInRequest';
import { createJwt } from '../../infrastructure/authentication';

const router = express.Router();
const userService = new UserService();

router.post('/', async (req: express.Request, res: express.Response, error: NextFunction) => {
    try {
        res.status(200).send('OK');
    }
    catch(err) {
        error(err);
    }
});

router.post('/singInRequests',
    async (req: express.Request, res: express.Response, error: NextFunction) => {
        try {
            const requestBody = req.body as SignInRequest;
            const user = await userService.checkCredentials(requestBody);
            const jwt = await createJwt(user);
            res.status(200).send(jwt);
        }
        catch(err) {
            error(err);
        }
});

export default router;