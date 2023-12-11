import { promises } from 'node:fs';
import { randomUUID } from 'crypto';
import config from 'config';
import { VotaOptions } from './votaOptions';
import { exec } from 'child_process';
import { CandidateDao } from '../typings/daos/candidateDao';
import { Gender } from '../typings/gender';
import { BallotWithVotesDao } from '../typings/daos/ballotWithVotesDao';

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

export async function countVotes(isTestRun: boolean, candidates: Array<CandidateDao>, withGenderParity: boolean, ballots: BallotWithVotesDao[]) {
    const votaOptions: VotaOptions = config.get('vota');
    let candidatesCsvData = '';
    let ballotsCsvData = '';
    for (const candidate of candidates) {
        const cleanCandidateName = candidate.name.replaceAll(';', ':');
        candidatesCsvData += `${cleanCandidateName};${candidate.gender === Gender.Female || !withGenderParity ? '1' : '0'}\r\n`;
        ballotsCsvData += `;${cleanCandidateName}`;
    }
    ballotsCsvData += '\r\n';
    const groupedBallots = [] as Array<{ ballotId: number, items: BallotWithVotesDao[] }>;
    for (const ballot of ballots) {
        let ballotGroup = groupedBallots.find(g => g.ballotId === ballot.ballotId);
        if (!ballotGroup) {
            ballotGroup = { ballotId: ballot.ballotId, items: [] };
            groupedBallots.push(ballotGroup);
        }

        ballotGroup.items.push(ballot);
    }
    for (const ballot of groupedBallots) {
        ballotsCsvData += `${ballot.items[0].ballotIdentifier ?? crypto.randomUUID()};`;
        for (const candidate of candidates) {
            const item = ballot.items.find(bi => bi.candidateId === candidate.id);
            if(!item) {
                ballotsCsvData += ';';
            }
            else {
                ballotsCsvData += `${item.ballotOrder};`;
            }
        }
        ballotsCsvData = `${ballotsCsvData.slice(0, -1)}\r\n`;
    }

    const candidateFilename = `${randomUUID()}.csv`;
    const ballotsFilename = `${randomUUID()}.csv`;

    await promises.writeFile(`${votaOptions.tempFolder}/${candidateFilename}`, candidatesCsvData);
    await promises.writeFile(`${votaOptions.tempFolder}/${ballotsFilename}`, ballotsCsvData);
    const protocolFilename = `${randomUUID()}.txt`;

    const dotnetCommand = `dotnet ${votaOptions.cliPath} --spreadsheetfile=${votaOptions.tempFolder}/${ballotsFilename} --candidates=${votaOptions.tempFolder}/${candidateFilename} -p ${votaOptions.tempFolder}/${protocolFilename} -s 2 -t QuotedSTV`;
    await new Promise((resolve, reject) => {
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
}