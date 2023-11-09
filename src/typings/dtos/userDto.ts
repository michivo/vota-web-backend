export interface UserDto {
    id: number,
    roleId: number,
    username: string,
    email: string | undefined | null,
    fullName: string,
    password: string,
};
