import { openDb } from '../../infrastructure/database';
import { Greeting } from '../../typings/greeting';

class HealthService {
    sayHello = (name: string): Greeting => {
        return {
            message: `Hello ${name}! This is the Vota Web API, nice to see you!`,
        };
    };

    sayHelloWithDbCheck = async (name: string): Promise<Greeting> => {
        const db = await openDb();

        await db.run('INSERT INTO Greeting (name) VALUES (?)', name);
        const results = await db.all('SELECT * FROM Greeting WHERE name = ? ORDER BY id DESC LIMIT 1', name);

        return {
            message: `Hello ${results[0].name}! Your id is ${results[0].id}`,
        }
    }
}

export default HealthService;
