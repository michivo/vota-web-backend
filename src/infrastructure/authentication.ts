import jwt from 'jsonwebtoken';
import express, { RequestHandler } from 'express';
import axios from 'axios';
import { ForbiddenError, UnauthorizedError } from './errors';
import { UserDao } from '../typings/daos/userDao';
import fs from 'fs';
import config from 'config';
import { AuthOptions } from './authOptions';

type Key = {
    kid: string;
    key: string;
}

export type TokenPayload = {
    role: string;
}

class AuthenticationService {

    private _privateKey: Buffer;
    private _publicKey: Buffer;
    private _authSettings: AuthOptions;

    public constructor() {
        this._authSettings = config.get('auth') as AuthOptions;
        this._privateKey = fs.readFileSync(this._authSettings.privateKeyFile);
        this._publicKey = fs.readFileSync(this._authSettings.publicKeyFile);
    }

    public async authorize(authHeader: string, role: string | undefined = undefined) {
        if (authHeader) {

            // get the token from the authorization header (format: Bearer token)
            const token = authHeader.split(' ')[1];

            try {
                const decodedToken = jwt.decode(token, { complete: true });

                const keyId = decodedToken?.header.kid;
                if(keyId !== this._authSettings.keyId) {
                    throw new ForbiddenError(`Invalid key id ${keyId}`);
                }

                const verifiedToken = jwt.verify(token, this._publicKey!, {
                    algorithms: ['RS256'],
                }) as TokenPayload;
                if (role && verifiedToken) {
                    if (verifiedToken.role === role) {
                        return;
                    }
                }

            } catch (error) {
                console.log(error);
                throw new ForbiddenError();
            }
        }
        throw new UnauthorizedError();
    };

    public createJwt(user: UserDao): string {
        var token = jwt.sign({ 
            sub: user.username, 
            role: user.roleId, 
            name: user.fullName ?? user.username }, this._privateKey, 
            { algorithm: 'RS256', expiresIn: "24h", keyid: this._authSettings.keyId } );
        return token;
    }
}

const authService = new AuthenticationService();

export const authorizationHandler: RequestHandler = async (
    req: express.Request,
    _res: express.Response,
    next: express.NextFunction
) => {
    const authHeader = req.headers.authorization as string;
    try {
        await authService.authorize(authHeader);
    }
    catch (err) {
        next(err);
        return;
    }
    next();
};

export const roleBasedAuthorization = (role: string) => {
    return async (req: express.Request,
        _res: express.Response,
        next: express.NextFunction
    ) => {
        const authHeader = req.headers.authorization as string;
        try {
            await authService.authorize(authHeader, role);
        }
        catch(err) {
            next(err);
            return;
        }
        next();
    }
};

export const createJwt = (user: UserDao): string => {
    return authService.createJwt(user);
}