import express, { NextFunction } from 'express';
import { BadRequestError, UnauthorizedError } from '../../infrastructure/errors';
import { ElectionService } from './electionService';
import { ElectionDto, ElectionWithCandidatesDto } from '../../typings/dtos/electionDto';
import { UserRole } from '../../typings/userRole';
import { authorizationHandler, roleBasedAuthorization } from '../../infrastructure/authentication';
import { param } from 'express-validator';
import { CountElectionRequest } from '../../typings/dtos/countElectionRequest';

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
            res.send({ electionId });
        }
        catch (err) {
            error(err);
        }
    });

router.get('/', authorizationHandler,
    async (_req: express.Request, res: express.Response, error: NextFunction) => {
        try {
            const allElections = await electionService.getAllElections();
            res.send(allElections);
        }
        catch (err) {
            error(err);
        }
    });

router.get('/:electionId', authorizationHandler,
    param('electionId').isNumeric(),
    async (req: express.Request, res: express.Response, error: NextFunction) => {
        try {
            const allElections = await electionService.getElection(parseInt(req.params.electionId));
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
            res.send({ success: true });
        }
        catch (err) {
            error(err);
        }
    });

router.delete('/:electionId', roleBasedAuthorization(UserRole.Admin),
    param('electionId').isNumeric(),
    async (req: express.Request, res: express.Response, error: NextFunction) => {
        try {
            await electionService.deleteElection(parseInt(req.params.electionId));
            res.send({ success: true });
        }
        catch (err) {
            error(err);
        }
    });

router.post('/:electionId/countRequests', roleBasedAuthorization(UserRole.Admin),
    param('electionId').isNumeric(),
    async (req: express.Request, res: express.Response, error: NextFunction) => {
        try {
            const request = req.body as CountElectionRequest;
            await electionService.countVotes(parseInt(req.params.electionId), req.user!.id, request);
            res.send({ success: true });
        }
        catch (err) {
            error(err);
        }
    });

router.get('/:electionId/results', roleBasedAuthorization(UserRole.Admin),
    param('electionId').isNumeric(),
    async (req: express.Request, res: express.Response, error: NextFunction) => {
        try {
            const result = await electionService.getResults(parseInt(req.params.electionId));
            res.send(result);
        }
        catch (err) {
            error(err);
        }
    });

export default router;
