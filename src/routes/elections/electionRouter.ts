import express, { NextFunction } from 'express';
import { ValidationChain, body, validationResult } from 'express-validator';
import { BadRequestError } from '../../infrastructure/errors';
import { ElectionService } from './electionService';

const router = express.Router();
const userService = new ElectionService();

router.post('/', async (req: express.Request, res: express.Response, error: NextFunction) => {
    try {
        
    }
    catch(err) {
        error(err);
    }
});

router.put('/:electionId', async (req: express.Request, res: express.Response, error: NextFunction) => {
    try {
        
    }
    catch(err) {
        error(err);
    }
});
