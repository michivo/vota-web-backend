import { genSalt, hash } from 'bcrypt';
import { openDb } from '../../infrastructure/database';
import { BadRequestError, NotFoundError } from '../../infrastructure/errors';
import { UserDao } from '../../typings/daos/userDao';
import { SignInRequest } from '../../typings/dtos/signInRequest';
import { UserDto, UserWithPasswordDto } from '../../typings/dtos/userDto';

class UserService {
    checkCredentials = async (signInRequest: SignInRequest): Promise<UserDao> => {
        const db = await openDb();
        try {
            const results = await db.all('SELECT * FROM USER WHERE username = (?)', signInRequest.username);

            if (results.length === 0) {
                throw new NotFoundError();
            }

            const user = results[0] as UserDao;

            const passwordHash = await hash(signInRequest.password, user.passwordSalt);

            if (passwordHash !== user.passwordHash) {
                throw new NotFoundError();
            }
            return user;
        }
        finally {
            db.close();
        }
    }

    createUser = async (user: UserWithPasswordDto): Promise<number | undefined> => {
        const db = await openDb();
        try {
            const existingUser = await db.get('SELECT id FROM User WHERE username = (?)', user.username);

            if (existingUser) {
                throw new BadRequestError('Ein*e Benutzer*in mit diesem Namen existiert bereits.');
            }

            const salt = await genSalt(10);
            const passwordHash = await hash(user.password, salt);

            const result = await db.run('INSERT INTO User (roleId, username, email, fullName, passwordHash, passwordSalt) VALUES ' +
                '($roleId, $username, $email, $fullName, $passwordHash, $passwordSalt)', {
                $roleId: user.role,
                $username: user.username,
                $email: user.email,
                $fullName: user.fullName,
                $passwordHash: passwordHash,
                $passwordSalt: salt
            });

            console.error(JSON.stringify(result));
            return result.lastID;
        }
        finally {
            db.close();
        }
    }

    public async getUsers(): Promise<UserDto[]> {
        const db = await openDb();
        try {
            const results = await db.all('SELECT id, roleId, username, email, fullName FROM User WHERE isActive = 1');
            const userDaos = results.map(r => r as UserDao);
            return userDaos.map(dao => this.mapToUserDto(dao));
        }
        finally {
            db.close();
        }
    }

    public async updateUser(user: UserDto): Promise<void> {
        const db = await openDb();
        try {
            const existingUser = await db.get('SELECT id FROM User WHERE id = (?) AND isActive = 1', user.id);

            if (!existingUser) {
                throw new BadRequestError('Diese*r Benutzer*in existiert nicht.');
            }
            await db.run('UPDATE User SET roleId = $roleId, ' +
                'username = $username, email = $email, ' +
                'fullName = $fullName WHERE ' +
                'User.id = $userId', {
                $roleId: user.role,
                $username: user.username,
                $email: user.email,
                $fullName: user.fullName,
                $userId: user.id,
            });
        }
        finally {
            db.close();
        }        
    }

    public async updatePassword(userId: number, password: string): Promise<void> {
        const db = await openDb();
        try {
            const existingUser = await db.get('SELECT id FROM User WHERE id = (?) AND isActive = 1', userId);

            if (!existingUser) {
                throw new BadRequestError('Diese*r Benutzer*in existiert nicht.');
            }
            const salt = await genSalt(10);
            const passwordHash = await hash(password, salt);
            await db.run('UPDATE User SET passwordHash = $passwordHash, ' +
                'passwordSalt = $passwordSalt WHERE ' +
                'User.id = $userId', {
                    $passwordHash: passwordHash,
                    $passwordSalt: salt,
                    $userId: userId,
            });
        }
        finally {
            db.close();
        }        
    }    

    public async deleteUser(id: number): Promise<void> {
        const db = await openDb();
        try {
            const existingUser = await db.get('SELECT id FROM User WHERE id = (?)', id);

            if (!existingUser) {
                throw new BadRequestError('Diese*r Benutzer*in existiert nicht.');
            }

            await db.run('UPDATE User SET isActive = false WHERE id = (?)', id);
        }
        finally {
            db.close();
        }        
    }

    private mapToUserDto(dao: UserDao): UserDto {
        return {
            role: dao.roleId,
            email: dao.email,
            fullName: dao.fullName,
            id: dao.id,
            username: dao.username
        };
    }

    // id           INTEGER PRIMARY KEY AUTOINCREMENT,
    // roleId       INTEGER NOT NULL,
    // username     TEXT    NOT NULL,
    // email        TEXT    NULL,
    // isActive     NUMERIC NOT NULL DEFAULT 1,
    // fullName     TEXT    NULL,
    // passwordHash TEXT    NOT NULL,
    // passwordSalt TEXT    NOT NULL
}

export default UserService;

