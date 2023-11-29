import config from 'config';
import { VotaOptions } from './votaOptions';
import { exec } from 'child_process';

export async function testVota(): Promise<string> {
    const votaOptions: VotaOptions = config.get('vota');
    const dotnetCommand = `dotnet ${votaOptions.cliPath} --help`;
    console.log(`Testing Vota with ${dotnetCommand}`);
    try {
        const output = await new Promise((resolve, reject) => {
            exec(dotnetCommand, (err, stdout, stderr) => {
                if (err) {
                    console.error(`Rejecting with code ${err}`);
                    reject(err);
                }
                else {
                    console.error('Resolving');
                    resolve(stdout + stderr);
                }
            });
        }
        );
        return output as string;
    }
    catch (err: unknown) {
        return `Unknown error executing vota: ${err}`;
    }
}
