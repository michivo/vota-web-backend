import { hash } from 'bcrypt';
import { openDb } from '../../infrastructure/database';
import { NotFoundError } from '../../infrastructure/errors';
import { UserDao } from '../../typings/userDao';

class UserService {
    checkCredentials = async (name: string, password: string): Promise<void> => {
        const db = await openDb();

        const results = await db.all('SELECT * FROM USER WHERE username = (?)', name);

        if(results.length === 0) {
            throw new NotFoundError();
        }

        const user = results[0] as UserDao;

        const passwordHash = await hash(password, user.passwordSalt);

        if(passwordHash !== user.passwordHash) {
            throw new NotFoundError();
        }
    }
}

export default UserService;
