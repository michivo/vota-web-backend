import { hash } from 'bcrypt';
import { openDb } from '../../infrastructure/database';
import { NotFoundError } from '../../infrastructure/errors';
import { UserDao } from '../../typings/daos/userDao';
import { SignInRequest } from '../../typings/dtos/signInRequest';

class UserService {
    checkCredentials = async (signInRequest: SignInRequest): Promise<UserDao> => {
        const db = await openDb();

        const results = await db.all('SELECT * FROM USER WHERE username = (?)', signInRequest.username);

        if(results.length === 0) {
            throw new NotFoundError();
        }

        const user = results[0] as UserDao;

        const passwordHash = await hash(signInRequest.password, user.passwordSalt);

        if(passwordHash !== user.passwordHash) {
            throw new NotFoundError();
        }

        return user;
    }
}

export default UserService;
