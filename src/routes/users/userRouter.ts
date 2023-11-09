import express, { NextFunction } from 'express';
import UserService from './userService';
import { SignInRequest } from '../../typings/dtos/signInRequest';
import { createJwt } from '../../infrastructure/authentication';
import { UserDto } from '../../typings/dtos/userDto';
import { ValidationChain, body, validationResult } from 'express-validator';
import { BadRequestError } from '../../infrastructure/errors';

const router = express.Router();
const userService = new UserService();

const validation: ValidationChain[] = [
    body('username').notEmpty().isLength({min: 3, max: 50}),
    body('password').isStrongPassword({ minLength: 8 }),
    body('email').optional().isEmail(),
]

router.post('/', validation, async (req: express.Request, res: express.Response, error: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new BadRequestError(JSON.stringify(errors));
        }

        const newUser = req.body as UserDto;
        const newUserId = await userService.createUser(newUser);
        res.send({ userId: newUserId});
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
            res.send(jwt);
        }
        catch(err) {
            error(err);
        }
});

export default router;