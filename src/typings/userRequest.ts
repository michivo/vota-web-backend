import { UserRole } from './userRole';

export interface AuthorizedUserInfo {
  role: UserRole,
  name: string,
  id: number,
}

declare global {
// eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    export interface Request {
      user?: AuthorizedUserInfo;
    }
  }
}