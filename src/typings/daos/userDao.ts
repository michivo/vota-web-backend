export interface UserDao {
    id: number,
    roleId: number,
    username: string,
    email: string | undefined | null,
    isActive: boolean,
    fullName: string,
    passwordHash: string,
    passwordSalt: string,
};
