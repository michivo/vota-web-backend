import express, { NextFunction } from 'express';
import { authorizationHandler, roleBasedAuthorization } from '../../infrastructure/authentication';
import { UnauthorizedError } from '../../infrastructure/errors';
import { BallotWithVotesDto } from '../../typings/dtos/ballotDto';
import { BallotService } from './ballotService';
import { UserRole } from '../../typings/userRole';
import { DeleteBallotRequest } from '../../typings/dtos/deleteBallotRequest';
import { body } from 'express-validator';

const router = express.Router();
const ballotService = new BallotService();

router.post('/', authorizationHandler,
    async (req: express.Request, res: express.Response, error: NextFunction) => {
        try {
            const ballot = req.body as BallotWithVotesDto;
            if (!req.user?.id) {
                throw new UnauthorizedError();
            }
            const ballotId = await ballotService.addBallot(ballot, req.user?.id);
            res.send({ ballotId });
        }
        catch (err) {
            error(err);
        }
    });

router.get('/:electionId', authorizationHandler,
    async (req: express.Request, res: express.Response, error: NextFunction) => {
        try {
            const allBallots = await ballotService.getBallots(parseInt(req.params.electionId));
            res.send(allBallots);
        }
        catch (err) {
            error(err);
        }
    });

router.post('/deleteRequests', roleBasedAuthorization(UserRole.Admin),  
    body('deleteReason').notEmpty(),
    async (req: express.Request, res: express.Response, error: NextFunction) => {
    try {
        const deleteRequest = req.body as DeleteBallotRequest;
        const allBallots = await ballotService.deleteBallot(deleteRequest, req.user!.id);
        res.send(allBallots);
    }
    catch (err) {
        error(err);
    }
});

export default router;
