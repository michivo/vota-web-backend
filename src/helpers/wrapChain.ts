import { ValidationChain } from "express-validator";
import express from 'express';

export function wrapChain(chain: ValidationChain) {
    return (req: express.Request, res: express.Response, next: (error?: any) => void) => Promise.resolve(chain(req, res, next));
}