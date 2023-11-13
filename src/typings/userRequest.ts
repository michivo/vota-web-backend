import { UserRole } from "./userRole";

export interface AuthorizedUserInfo {
    role: UserRole,
    name: string,
    id: number,
}

declare global {
  namespace Express {
    export interface Request {
      user?: AuthorizedUserInfo;
    }
  }
}