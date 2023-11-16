import express, { NextFunction } from 'express';
import UserService from './userService';
import { SignInRequest } from '../../typings/dtos/signInRequest';
import { authorizationHandler, createJwt, roleBasedAuthorization } from '../../infrastructure/authentication';
import { UserDto, UserWithPasswordDto } from '../../typings/dtos/userDto';
import { ValidationChain, body, param, validationResult } from 'express-validator';
import { BadRequestError, UnauthorizedError } from '../../infrastructure/errors';
import { UserRole } from '../../typings/userRole';

const router = express.Router();
const userService = new UserService();

const validation: ValidationChain[] = [
    body('username').notEmpty().isLength({ min: 3, max: 50 }),
    body('password').isStrongPassword({ minLength: 8 }),
    body('email').optional().isEmail(),
]

router.post('/', roleBasedAuthorization(UserRole.Admin), validation,
    async (req: express.Request, res: express.Response, error: NextFunction) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new BadRequestError(JSON.stringify(errors));
            }

            const newUser = req.body as UserWithPasswordDto;
            const newUserId = await userService.createUser(newUser);
            res.send({ userId: newUserId });
        }
        catch (err) {
            error(err);
        }
    });

router.post('/signInRequests',
    async (req: express.Request, res: express.Response, error: NextFunction) => {
        try {
            const requestBody = req.body as SignInRequest;
            const user = await userService.checkCredentials(requestBody);
            const jwt = await createJwt(user);
            res.send({ token: jwt });
        }
        catch (err) {
            error(err);
        }
    });

router.get('/', roleBasedAuthorization(UserRole.Admin),
    async (_req: express.Request, res: express.Response, error: NextFunction) => {
        try {
            const users = await userService.getUsers();
            res.send(users);
        }
        catch (err) {
            error(err);
        }
    });

router.put('/:userId', roleBasedAuthorization(UserRole.Admin), 
    body('username').notEmpty().isLength({ min: 3, max: 50 }), 
    param('userId').isNumeric(),
    body('email').optional().isEmail(),
    async (req: express.Request, res: express.Response, error: NextFunction) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new BadRequestError(JSON.stringify(errors));
            }
            const user = req.body as UserDto;
            if(user.id !== parseInt(req.params.userId)) {
                throw new BadRequestError(`Ungültige Benutzer*innen-ID: ${user.id} vs ${req.params.userId}`);
            }
            await userService.updateUser(user);
            res.send({ success: true });
        }
        catch (err) {
            error(err);
        }
    });

router.post('/:userId/password', authorizationHandler, 
    param('userId').isNumeric(), body('password').isStrongPassword({ minLength: 8 }),
    async (req: express.Request, res: express.Response, error: NextFunction) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new BadRequestError(JSON.stringify(errors));
            }
            const userId = parseInt(req.params.userId);
            if(req.user?.id !== userId && req.user?.role !== UserRole.Admin) {
                throw new UnauthorizedError();
            }
            await userService.updatePassword(userId, req.body.password);
            res.send({ success: true });
        }
        catch (err) {
            error(err);
        }
    });

router.delete('/:userId', roleBasedAuthorization(UserRole.Admin),
    param('userId').isNumeric(),
    async (req: express.Request, res: express.Response, error: NextFunction) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new BadRequestError(JSON.stringify(errors));
            }
            await userService.deleteUser(parseInt(req.params.userId));
            res.send({ success: true });
        }
        catch (err) {
            error(err);
        }
    });

export default router;