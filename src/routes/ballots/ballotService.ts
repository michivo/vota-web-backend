import { Database } from 'sqlite';
import { openDb } from '../../infrastructure/database';
import { BadRequestError, InternalError } from '../../infrastructure/errors';
import { BallotDao } from '../../typings/daos/ballotDao';
import { BallotInfoDto, BallotWithVotesDto } from '../../typings/dtos/ballotDto';
import { ElectionState } from '../../typings/electionState';

export class BallotService {
    async getBallots(electionId: number): Promise<BallotInfoDto[]> {
        const db = await openDb();
        try {
            const results = await db.all('SELECT Ballot.id, Ballot.additionalPeople, Ballot.ballotIdentifier, Ballot.ballotStation, ' +
                ' Ballot.dateCreatedUtc, Ballot.countingUserId, Ballot.electionId, Ballot.isValid, Ballot.notes, User.username, User.fullName ' +
                ' FROM Ballot INNER JOIN User ON Ballot.countingUserId = User.Id WHERE electionId = (?)', electionId);
            const elections = results.map(e => e as BallotDao & { username: string, fullName: string });
            return elections.map(this.mapToBallotDto);
        }
        finally {
            db.close();
        }
    }

    async addBallot(ballot: BallotWithVotesDto, userId: number): Promise<number | undefined> {
        const db = await openDb();
        try { // TODO election state check, ballot number uniqueness check
            await checkIsBallotValid(ballot, db);
            const result = await db.run('INSERT INTO Ballot ' +
                '(additionalPeople,   ballotIdentifier,  ballotStation,  countingUserId,  electionId,  isValid,  notes) VALUES ' +
                '($additionalPeople, $ballotIdentifier, $ballotStation, $countingUserId, $electionId, $isValid, $notes)', {
                $additionalPeople: ballot.additionalPeople,
                $ballotIdentifier: ballot.ballotIdentifier,
                $ballotStation: ballot.ballotStation,
                $countingUserId: userId,
                $electionId: ballot.electionId,
                $isValid: 1,
                $notes: ballot.notes,
            });
            console.debug(`inserted ballot with id ${result.lastID}`);
            if (!result.lastID) {
                console.error('Ballot could not be inserted');
                throw new InternalError('Ballot could not be inserted');
            }
            for (const vote of ballot.votes) {
                await db.run('INSERT INTO BallotItem ' +
                    '(ballotId, candidateId, ballotOrder) VALUES ' +
                    '($ballotId, $candidateId, $ballotOrder)', {
                    $ballotId: result.lastID,
                    $candidateId: vote.candidateId,
                    $ballotOrder: vote.order,
                });
            }

            return result.lastID;
        }
        finally {
            db.close();
        }
    }

    private mapToBallotDto(ballotDao: BallotDao & { username: string, fullName: string }): BallotInfoDto {
        return {
            id: ballotDao.id,
            additionalPeople: ballotDao.additionalPeople || '',
            ballotIdentifier: ballotDao.ballotIdentifier || '',
            ballotStation: ballotDao.ballotStation || '',
            dateCreated: ballotDao.dateCreatedUtc,
            countingUserId: ballotDao.countingUserId,
            electionId: ballotDao.countingUserId,
            isValid: ballotDao.isValid,
            notes: ballotDao.notes || '',
            countingUserName: ballotDao.fullName || ballotDao.username,
        };
    }

}

async function checkIsBallotValid(ballot: BallotWithVotesDto, db: Database) {
    const result = await db.get('SELECT electionState FROM Election WHERE id = (?)', ballot.electionId);
    if (!result) {
        throw new BadRequestError(`Wahl mit ID ${ballot.electionId} existiert nicht.`);
    }
    if (result.electionState !== ElectionState.Counting) {
        throw new BadRequestError(`Stimmen für die Wahl mit ID ${ballot.id} können derzeit nicht gezählt werden.`);
    }
    if (ballot.ballotIdentifier) {
        const existingBallot = await db.get('SELECT id FROM Ballot WHERE ballotIdentifier = (?)', ballot.ballotIdentifier);
        if (existingBallot) {
            throw new BadRequestError(`Eine Stimme mit Stimmzettel-Nummer ${ballot.ballotIdentifier} wurde bereits erfasst`);
        }
    }
}

