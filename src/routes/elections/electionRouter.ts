import express, { NextFunction } from 'express';
import { BadRequestError, UnauthorizedError } from '../../infrastructure/errors';
import { ElectionService } from './electionService';
import { ElectionDto, ElectionWithCandidatesDto } from '../../typings/dtos/electionDto';
import { UserRole } from '../../typings/userRole';
import { roleBasedAuthorization } from '../../infrastructure/authentication';

const router = express.Router();
const electionService = new ElectionService();

router.post('/', roleBasedAuthorization(UserRole.Admin),
    async (req: express.Request, res: express.Response, error: NextFunction) => {
    try {
        const election = req.body as ElectionDto;
        if (!req.user?.id) {
            throw new UnauthorizedError();
        }
        const electionId = await electionService.createElection(election, req.user?.id);
        res.send({electionId});
    }
    catch (err) {
        error(err);
    }
});

router.get('/', roleBasedAuthorization(UserRole.Admin), 
    async (req: express.Request, res: express.Response, error: NextFunction) => {
    try {
        const allElections = await electionService.getElectionsForUser(req.user?.id ?? 0);
        res.send(allElections);
    }
    catch (err) {
        error(err);
    }
});

router.put('/:electionId', roleBasedAuthorization(UserRole.Admin), 
    async (req: express.Request, res: express.Response, error: NextFunction) => {
    try {
        const election = req.body as ElectionWithCandidatesDto;
        if (election.id.toString() !== req.params.electionId) {
            throw new BadRequestError('Ungültige Wahl-ID');
        }

        await electionService.updateElection(election);
        res.send('OK');
    }
    catch (err) {
        error(err);
    }
});

export default router;
