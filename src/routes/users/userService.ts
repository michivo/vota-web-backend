import crypto from 'crypto';
import { genSalt, hash } from 'bcrypt';
import { openDb } from '../../infrastructure/database';
import { BadRequestError, NotFoundError } from '../../infrastructure/errors';
import { UserDao } from '../../typings/daos/userDao';
import { SignInRequest } from '../../typings/dtos/signInRequest';
import { CreateUserRequest, UserDto } from '../../typings/dtos/userDto';
import { sendResetMail } from '../../infrastructure/mail';
import { Database } from 'sqlite';
import { RegionDto } from '../../typings/dtos/regionDto';

class UserService {

    checkCredentials = async (signInRequest: SignInRequest): Promise<UserDto> => {
        const db = await openDb();
        try {
            const results = await db.all('SELECT User.id, User.username, User.roleId, User.email, User.isActive, User.fullName, ' + 
            'User.passwordHash, User.passwordSalt, Region.id as regionId, Region.regionName ' + 
            'FROM User LEFT JOIN UserRegion ON UserRegion.userId=User.id LEFT JOIN Region ON Region.id = UserRegion.regionId WHERE User.isActive=1 AND User.username = (?)', signInRequest.username);

            if (results.length === 0) {
                throw new NotFoundError();
            }

            const user = results[0] as UserDao;
            const region = {
                id: results[0].regionId,
                regionName: results[0].regionName,
            };
            const userDto = this.mapToUserDto(user, region);

            const passwordHash = await hash(signInRequest.password, user.passwordSalt);

            if (passwordHash !== user.passwordHash) {
                throw new NotFoundError();
            }
            return userDto;
        }
        finally {
            db.close();
        }
    }

    createUser = async (user: CreateUserRequest): Promise<number | undefined> => {
        const db = await openDb();
        try {
            const existingUser = await db.get('SELECT id FROM User WHERE username = (?)', user.username);

            if (existingUser) {
                throw new BadRequestError('Ein*e Benutzer*in mit diesem Namen existiert bereits.');
            }

            const salt = await genSalt(10);
            let password = user.password?.trim() ?? '';
            if(user.sendPasswordLink) {
                password = crypto.randomUUID();
            }
            const passwordHash = await hash(password, salt);

            const result = await db.run('INSERT INTO User (roleId, username, email, fullName, passwordHash, passwordSalt) VALUES ' +
                '($roleId, $username, $email, $fullName, $passwordHash, $passwordSalt)', {
                $roleId: user.role,
                $username: user.username,
                $email: user.email,
                $fullName: user.fullName,
                $passwordHash: passwordHash,
                $passwordSalt: salt,
            });
            for(const region of user.regions) {
                await db.run('INSERT INTO UserRegion (regionId, userId) VALUES ($regionId, $userId)', 
                {
                    $regionId: region.id,
                    $userId: result.lastID,
                });
            }

            if(user.sendPasswordLink && user.email) {
                const challenge = crypto.randomUUID();
                await db.run('INSERT INTO PasswordReset (challenge, userId, dateCreated) VALUES ' + 
                    '($challenge, $userId, $dateCreated)', {
                        $challenge: challenge,
                        $userId: result.lastID,
                        $dateCreated: new Date(),
                    });
                await sendResetMail(challenge, user.email);
            }
            return result.lastID;
        }
        finally {
            db.close();
        }
    }

    public async getUsers(): Promise<UserDto[]> {
        const db = await openDb();
        try {
            const queryResults = await db.all('SELECT User.id, User.username, User.roleId, User.email, User.isActive, User.fullName, Region.id as regionId, Region.regionName ' + 
                'FROM User INNER JOIN UserRegion ON UserRegion.userId=User.id INNER JOIN Region ON Region.id = UserRegion.regionId WHERE User.isActive=1');
            const result: UserDto[] = [];
            for(const user of queryResults) {
                const existingUser = result.find(u => u.id === user.id);
                const region = {
                    id: user.regionId,
                    regionName: user.regionName,
                };
                if(existingUser) {
                    existingUser.regions.push(region);
                }
                else {
                    result.push(this.mapToUserDto(user, region));
                }
            }
            return result;
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
            await this.setPassword(db, userId, password);
        }
        finally {
            db.close();
        }        
    }    

    private async setPassword(db: Database, userId: number, password: string) {
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

    public async deleteUser(id: number): Promise<void> {
        const db = await openDb();
        try {
            const existingUser = await db.get('SELECT id FROM User WHERE id = (?)', id);

            if (!existingUser) {
                throw new BadRequestError('Diese*r Benutzer*in existiert nicht.');
            }

            await db.run('UPDATE User SET isActive = false, username = \'___deleted___\' || username WHERE id = (?)', id);
        }
        finally {
            db.close();
        }        
    }

    public async setPasswordFromChallenge(challenge: string, password: string) {
        const db = await openDb();
        try {
            const dbChallenge = await db.get('SELECT * FROM PasswordReset WHERE challenge = (?)', challenge);
            const userId = dbChallenge.userId;
            const dateCreated = new Date(dbChallenge.dateCreated);
            const now = new Date();
            if(now.valueOf() - dateCreated.valueOf() > 24 * 3600 * 1000) {
                throw new BadRequestError('Dieser Link ist bereits abgelaufen');
            }
            const epoch = new Date(0);
            await this.setPassword(db, userId, password);
            await db.run('UPDATE PasswordReset SET dateCreated = $epoch WHERE id = $resetId', {
                $epoch: epoch,
                $resetId: dbChallenge.id,
            });
        }
        finally {
            db.close();
        }
    }    

    private mapToUserDto(dao: UserDao, region: RegionDto): UserDto {
        return {
            role: dao.roleId,
            email: dao.email,
            fullName: dao.fullName,
            id: dao.id,
            username: dao.username,
            regions: [ region ],
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

