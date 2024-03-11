import request from 'supertest';
import config from 'config';
import express from 'express';
import { ServerOptions } from '../../infrastructure/serverOptions';
import ConsoleLogger from '../../infrastructure/consoleLogger';
import Server from '../../server';
import { UserRole } from '../../typings/userRole';
import healthRouter from './healthRouter';

jest.mock('../../infrastructure/authentication', () => {
    return {
        authorizationHandler: async (_req: express.Request, _res: express.Response, next: express.NextFunction) => { next(); },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        roleBasedAuthorization: (_: UserRole) => { return (_req: express.Request, _res: express.Response, next: express.NextFunction) => { next(); } },
    }
});

jest.mock('../../infrastructure/database', () => {
    const actualModule = jest.requireActual('../../infrastructure/database');
    return {
        openDb: async () => { const db = await actualModule.openDb(); await db.migrate(); return db; },
        migrateDb: actualModule.migrateDb,
    }
});

describe('Health Router', () => {
    let app: express.Express;
    let server: Server;

    beforeEach(async () => {
        const serverOptions: ServerOptions = config.get('server');
        const logger = new ConsoleLogger();
        server = new Server(logger, healthRouter, serverOptions);
        await server.start();
        app = server.app;
    });

    afterEach(() => {
        server.stop();
    })

    test('Say Hello', async () => {
        const res = await request(app).get('/hello/votaworld');

        expect(res.body.message).toEqual('Hello votaworld! This is the Vota Web API, nice to see you!');
    });
    test('Say Hello With DB Check', async () => {
        const res = await request(app).get('/helloDb/votaworlddb');

        expect(res.body.message).toEqual('Hello votaworlddb! Your id is 1');
    });
});