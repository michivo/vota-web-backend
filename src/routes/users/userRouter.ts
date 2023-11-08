import express from 'express';
import UserService from './userService';

const router = express.Router();
const userService = new UserService();

router.get('/hello', (_: express.Request, res: express.Response) => {
    res.send('hello!');
});

router.post('/singInRequests',
    async (req: express.Request, res: express.Response) => {
        const requestBody = req.body;
        await userService.checkCredentials(requestBody.username, requestBody.password);
        res.status(200).send('OK');
});

export default router;