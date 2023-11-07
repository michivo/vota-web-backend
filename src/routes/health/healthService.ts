import { Greeting } from '../../typings/greeting';

class HealthService {
    sayHello = (name: string): Greeting => {
        return {
            message: `Hello ${name}! This is the Vota Web API, nice to see you!`,
        };
    };
}

export default HealthService;
