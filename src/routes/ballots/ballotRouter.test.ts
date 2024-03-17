import request from 'supertest';
import config from 'config';
import express from 'express';
import { ServerOptions } from '../../infrastructure/serverOptions';
import ConsoleLogger from '../../infrastructure/consoleLogger';
import Server from '../../server';
import { UserRole } from '../../typings/userRole';
import router from './ballotRouter';
import { Database } from 'sqlite';
import { ElectionService } from '../elections/electionService';
import UserService from '../users/userService';
import { ElectionState } from '../../typings/electionState';
import { ElectionType } from '../../typings/electionType';
import { BallotService } from './ballotService';

const actualDatabase = jest.requireActual('../../infrastructure/database');
let database: Database & { originalClose?: () => Promise<void> };

jest.mock('../../infrastructure/authentication', () => {
    return {
        authorizationHandler: async (_req: express.Request, _res: express.Response, next: express.NextFunction) => { next(); },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        roleBasedAuthorization: (_: UserRole) => {
            return (req: express.Request, _res: express.Response, next: express.NextFunction) => {
                req.user = { id: 1, role: UserRole.Admin, name: 'tester' };
                next();
            }
        },
    }
});

jest.mock('../../infrastructure/database', () => {
    return {
        openDb: async () => { database.close = async () => { }; return database; },
        migrateDb: async () => { },
    }
});

describe('Ballot Router', () => {
    let app: express.Express;
    let server: Server;

    beforeEach(async () => {
        database = await actualDatabase.openDb();
        database.originalClose = database.close;
        await database.migrate();
        const serverOptions: ServerOptions = config.get('server');
        const logger = new ConsoleLogger();
        server = new Server(logger, router, serverOptions);
        await server.start();
        app = server.app;
    });

    async function prepareData(addBallot: boolean) {
        const electionService = new ElectionService();
        const userService = new UserService();
        const ballotService = new BallotService();
        await userService.createUser({
            email: 'test@foo.com', fullName: 'Jane Doe',
            password: 'secret', regions: [], role: UserRole.Admin, sendPasswordLink: false, username: 'tester', id: 1,
        });
        await electionService.createElection({
            alreadyElectedFemale: 0, alreadyElectedMale: 0, createUserId: 1,
            dateCreated: new Date(), description: '',
            electionState: ElectionState.Counting, electionType: ElectionType.StandardSingleTransferableVote,
            numberOfPositionsToElect: 3, title: 'Test election', enforceGenderParity: true, id: 1,
        }, 1);
        if (addBallot) {
            await ballotService.addBallot({
                ballotIdentifier: 'A-01', ballotStation: 'A', isDeleted: false, canDelete: true,
                additionalPeople: '', countingUserId: 1, countingUserName: 'tester',
                dateCreated: new Date(), electionId: 1, id: 1, isValid: false, notes: '',
                votes: [],
            }, 1, UserRole.Admin);
        }
    }

    async function getBallot(identifier: string, electionId: number) {
        const ballot = await database.get('SELECT id, isDeleted FROM Ballot WHERE ballotIdentifier = (?) AND electionId = (?)', identifier, electionId);
        return ballot;
    }

    afterEach(async () => {
        server.stop();
        if (database.originalClose) {
            await database.originalClose();
        }
    })

    test('Delete ballot with valid delete request', async () => {
        await prepareData(true);
        const ballotPreDelete = await getBallot('A-01', 1);
        const res = await request(app).post('/deleteRequests').send({ ballotId: 1, electionId: 1, deleteReason: 'Nothing specific' });

        expect(res.body).toEqual({});
        expect(res.ok).toBeTruthy();
        const ballotPostDelete = await getBallot('A-01', 1);
        console.error(ballotPostDelete);
        expect(ballotPreDelete.isDeleted).toBeFalsy();
        expect(ballotPostDelete.isDeleted).toBeTruthy();
    });
});