import { UserRole } from "../userRole";

export interface UserDto {
    id: number,
    role: UserRole,
    username: string,
    email: string | undefined | null,
    fullName: string,
    password: string,
};
