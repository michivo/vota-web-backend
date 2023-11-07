import jwt from 'jsonwebtoken';
import express, { RequestHandler } from 'express';
import axios from 'axios';
import { ForbiddenError, UnauthorizedError } from './errors';

type Key = {
    kid: string;
    key: string;
}

export type TokenPayload = {
    role: string;
}

class AuthenticationService {

    private _configKeys: Key[];

    public constructor() {
        this._configKeys = [];
    }

    public async authorize(authHeader: string, role: string | undefined = undefined) {
        if (authHeader) {
            if (this._configKeys.length === 0) {
                await this.fetchKeys();
            }

            // get the token from the authorization header (format: Bearer token)
            const token = authHeader.split(' ')[1];

            try {
                const decodedToken = jwt.decode(token, { complete: true });

                const keyId = decodedToken?.header.kid;
                let key = this._configKeys.find((key) => key.kid === keyId);
                if (key === undefined) {
                    await this.fetchKeys(); // maybe the keys have changed, reload them
                    key = this._configKeys.find((key) => key.kid === keyId);
                    if (key === undefined) {
                        console.log(`Key with id ${keyId} not found.`);
                        throw new ForbiddenError();
                    }
                }

                const verifiedToken = jwt.verify(token, key.key, {
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

    private async fetchKeys() {
        const url = `https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com`;

        try {
            const { data } = await axios.get(url);
            for (const key in data) {
                this._configKeys.push({ kid: key, key: data[key] });
            }
            console.log(`Successfully fetched ${this._configKeys.length} keys from Google.`);
        } catch (error) {
            console.log('Error getting signing keys from Google:');
            throw (error);
        }
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