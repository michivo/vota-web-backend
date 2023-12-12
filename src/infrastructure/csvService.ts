import { CsvData } from '../typings/csvData';
import { BallotWithVotesDao } from '../typings/daos/ballotWithVotesDao';
import { CandidateDao } from '../typings/daos/candidateDao';
import { Gender } from '../typings/gender';

export function getCsvData(candidates: Array<CandidateDao>, ballots: BallotWithVotesDao[], withGenderParity: boolean): CsvData {
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

    return {
        voterList: candidatesCsvData,
        votes: ballotsCsvData,
    };
}
