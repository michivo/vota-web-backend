import { UserRole } from '../userRole';

export interface UserDto {
    id: number,
    role: UserRole,
    username: string,
    email: string | undefined | null,
    fullName: string,
}

export interface CreateUserRequest extends UserWithPasswordDto {
    sendPasswordLink: boolean,
}

export interface UserWithPasswordDto extends UserDto {
    password: string,
}
