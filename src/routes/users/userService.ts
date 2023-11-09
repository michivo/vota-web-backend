import { genSalt, hash } from 'bcrypt';
import { openDb } from '../../infrastructure/database';
import { BadRequestError, NotFoundError } from '../../infrastructure/errors';
import { UserDao } from '../../typings/daos/userDao';
import { SignInRequest } from '../../typings/dtos/signInRequest';
import { UserDto } from '../../typings/dtos/userDto';
import { Database } from 'sqlite3';

class UserService {
    private _db: Database | undefined;

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

    createUser = async (user: UserDto): Promise<number | undefined> => {
        const db = await openDb();
        try {
            const results = await db.all('SELECT id FROM User WHERE username = (?) LIMIT 1', user.username);

            if (results.length !== 0) {
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
