import { promises } from 'node:fs';
import { randomUUID } from 'crypto';
import config from 'config';
import { VotaOptions } from './votaOptions';
import { exec } from 'child_process';
import { CsvData } from '../typings/csvData';
import { VotaResultData } from '../typings/votaResultData';
import { ElectionDao } from '../typings/daos/electionDao';
import { ElectionType } from '../typings/electionType';

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

export async function countVotes(csvData: CsvData, invalidCount: number, election: ElectionDao): Promise<VotaResultData> {
    const votaOptions: VotaOptions = config.get('vota');

    const candidateFilename = `${randomUUID()}.csv`;
    const ballotsFilename = `${randomUUID()}.csv`;

    await promises.writeFile(`${votaOptions.tempFolder}/${candidateFilename}`, csvData.voterList);
    await promises.writeFile(`${votaOptions.tempFolder}/${ballotsFilename}`, csvData.votes);
    const protocolFilename = `${randomUUID()}.json`;
    const statsFilename = `${randomUUID()}.txt`;

    const dotnetCommand = `dotnet ${votaOptions.cliPath} ` + 
        `--spreadsheetfile=${votaOptions.tempFolder}/${ballotsFilename} ` +
        `--candidates=${votaOptions.tempFolder}/${candidateFilename} ` + 
        `-p ${votaOptions.tempFolder}/${protocolFilename} ` +
        `-s ${election.numberOfPositionsToElect} ` +
        `-e ${election.alreadyElectedMale + election.alreadyElectedFemale} ` + 
        `-E ${election.alreadyElectedFemale} ` + 
        `-S ${votaOptions.tempFolder}/${statsFilename} ` +
        `-t ${election.electionType === ElectionType.OrderedSingleTransferableVote ? 'RankedSTV' : election.electionType === ElectionType.UnorderedSingleTransferableVote ? 'QuotedSTV' : 'STV'}`;
    const result = await new Promise<VotaResultData>((resolve) => {
        exec(dotnetCommand, (err, stdout, stderr) => {
            if (err) {
                console.error(`Rejecting with code ${err}`);
                resolve({
                    success: false,
                    errorLog: err.message,
                    detailedLog: `### Ungültige Stimmen: ${invalidCount}\r\n${stdout}\r\n --- Errors: ${stderr}`,
                    protocol: undefined,
                    stats: undefined,
                });
            }
            else {
                resolve({
                    success: true,
                    errorLog: '',
                    detailedLog: `### Ungültige Stimmen: ${invalidCount}\r\n${stdout}\r\n --- Errors: ${stderr}`,
                    protocol: undefined,
                    stats: undefined,
                });
            }
        });
    }
    );

    if(result.success) {
        const protocol = await promises.readFile(`${votaOptions.tempFolder}/${protocolFilename}`);
        result.protocol = JSON.parse(protocol.toString('utf8'));

        const stats = await promises.readFile(`${votaOptions.tempFolder}/${statsFilename}`);
        result.stats = stats.toString('utf8');
    }

    return result;
}