import { UserRole } from '../userRole';
import { RegionDto } from './regionDto';

export interface UserDto {
    id: number,
    role: UserRole,
    username: string,
    email: string | undefined | null,
    fullName: string,
    regions: RegionDto[],
}

export interface CreateUserRequest extends UserWithPasswordDto {
    sendPasswordLink: boolean,
}

export interface UserWithPasswordDto extends UserDto {
    password: string,
}
