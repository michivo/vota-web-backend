import { Database } from 'sqlite';
import { openDb } from '../../infrastructure/database';
import { BadRequestError, InternalError } from '../../infrastructure/errors';
import { BallotDao } from '../../typings/daos/ballotDao';
import { BallotItemDto, BallotWithVotesDto } from '../../typings/dtos/ballotDto';
import { ElectionState } from '../../typings/electionState';
import { DeleteBallotRequest } from '../../typings/dtos/deleteBallotRequest';
import { UserRole } from '../../typings/userRole';
import { toUtcDate } from '../../helpers/dateHelper';

export class BallotService {
    async getBallots(electionId: number, role: UserRole): Promise<BallotWithVotesDto[]> {
        const db = await openDb();
        try {
            const canDelete = await checkCanDelete(db, electionId, role);
            const results = await db.all('SELECT Ballot.id, Ballot.additionalPeople, Ballot.ballotIdentifier, Ballot.ballotStation, ' +
                ' Ballot.dateCreatedUtc, Ballot.countingUserId, Ballot.electionId, Ballot.isValid, Ballot.notes, ' +
                ' Ballot.isDeleted, Ballot.deleteUserId, Ballot.deleteReason, Ballot.deleteDateUtc, CountingUser.username, CountingUser.fullName, ' +
                ' DeleteUser.username as deleteUsername, DeleteUser.fullName as deleteUserFullName ' +
                ' FROM Ballot INNER JOIN User CountingUser ON Ballot.countingUserId = CountingUser.Id ' +
                ' LEFT JOIN User DeleteUser ON Ballot.deleteUserId = DeleteUser.Id WHERE electionId = (?)', electionId);
            const ballots = results.map(e => e as BallotDao & { username: string, fullName: string, deleteUsername?: string, deleteUserFullName?: string });
            const ballotIds = ballots.map(b => b.id);
            const ballotItems = await db.all('SELECT BallotItem.id, BallotItem.ballotId, BallotItem.candidateId, BallotItem.ballotOrder, Candidate.name as candidateName ' + 
                `FROM BallotItem INNER JOIN Candidate ON Candidate.id = BallotItem.candidateId WHERE ballotId IN (${ballotIds.map(() => '?').join(',')})`, ballotIds);

            return ballots.map((b) => this.mapToBallotDto(b, canDelete, ballotItems.map(bi => bi as BallotItemDto).filter(bi => bi.ballotId === b.id)));
        }
        finally {
            db.close();
        }
    }

    async addBallot(ballot: BallotWithVotesDto, userId: number, role: UserRole): Promise<number | undefined> {
        const db = await openDb();
        try {
            await checkIsBallotValid(ballot, db, role);
            const result = await db.run('INSERT INTO Ballot ' +
                '(additionalPeople,   ballotIdentifier,  ballotStation,  countingUserId,  electionId,  isValid,  notes, deleteUserId) VALUES ' +
                '($additionalPeople, $ballotIdentifier, $ballotStation, $countingUserId, $electionId, $isValid, $notes, NULL)', {
                $additionalPeople: ballot.additionalPeople,
                $ballotIdentifier: ballot.ballotIdentifier,
                $ballotStation: ballot.ballotStation,
                $countingUserId: userId,
                $electionId: ballot.electionId,
                $isValid: ballot.isValid,
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

    deleteBallot = async (deleteRequest: DeleteBallotRequest, userId: number, role: UserRole) => {
        const db = await openDb();
        try {
            if(!checkCanDelete(db, deleteRequest.electionId, role)) {
                throw new BadRequestError('Stimmzettel kann nicht mehr gelöscht werden.');
            }
            await db.run('UPDATE Ballot SET isDeleted = 1, deleteUserId = $userId, ' +
                'deleteReason = $deleteReason, deleteDateUtc = $deleteDateUtc WHERE ' +
                'Ballot.id = $ballotId AND Ballot.electionId = $electionId', {
                $userId: userId,
                $deleteReason: deleteRequest.deleteReason,
                $deleteDateUtc: new Date(),
                $ballotId: deleteRequest.ballotId,
                $electionId: deleteRequest.electionId,
            });
        }
        finally {
            db.close();
        }
    }

    private mapToBallotDto(ballotDao: BallotDao & { username: string, fullName: string, deleteUsername?: string, deleteUserFullName?: string }, 
        canDelete: boolean, items: BallotItemDto[]): BallotWithVotesDto {
        return {
            id: ballotDao.id,
            additionalPeople: ballotDao.additionalPeople || '',
            ballotIdentifier: ballotDao.ballotIdentifier || '',
            ballotStation: ballotDao.ballotStation || '',
            dateCreated: toUtcDate(ballotDao.dateCreatedUtc),
            countingUserId: ballotDao.countingUserId,
            electionId: ballotDao.countingUserId,
            isValid: ballotDao.isValid,
            notes: ballotDao.notes || '',
            countingUserName: ballotDao.fullName || ballotDao.username,
            isDeleted: ballotDao.isDeleted,
            dateDeleted: ballotDao.deleteDateUtc ? toUtcDate(ballotDao.deleteDateUtc) : undefined,
            deleteReason: ballotDao.deleteReason,
            deleteUserId: ballotDao.deleteUserId,
            deleteUserName: ballotDao.isDeleted ? ballotDao.deleteUserFullName || ballotDao.deleteUsername : null,
            votes: items,
            canDelete,
        };
    }
}

async function checkCanDelete(db: Database, electionId: number, role: UserRole) {
    const result = await db.get('SELECT electionState FROM Election WHERE id = (?)', electionId);
    if (!result) {
        throw new BadRequestError(`Wahl mit ID ${electionId} existiert nicht.`);
    }
    return result.electionState === ElectionState.Counting || (result.electionState === ElectionState.CountingComplete && role === UserRole.Admin);
}

async function checkIsBallotValid(ballot: BallotWithVotesDto, db: Database, role: UserRole) {
    const result = await db.get('SELECT electionState FROM Election WHERE id = (?)', ballot.electionId);
    if (!result) {
        throw new BadRequestError(`Wahl mit ID ${ballot.electionId} existiert nicht.`);
    }
    if (result.electionState !== ElectionState.Counting && role !== UserRole.Admin) {
        throw new BadRequestError(`Stimmen für die Wahl mit ID ${ballot.electionId} können derzeit nicht gezählt werden.`);
    }
    if(result.electionState === ElectionState.Done) {
        throw new BadRequestError(`Stimmen für die Wahl mit ID ${ballot.electionId} können nicht mehr abgegeben oder gelöscht werden.`);
    }
    if (ballot.ballotIdentifier) {
        const existingBallot = await db.get('SELECT id FROM Ballot WHERE ballotIdentifier = (?) AND isDeleted = 0 AND electionId = (?)', ballot.ballotIdentifier, ballot.electionId);
        if (existingBallot) {
            throw new BadRequestError(`Eine Stimme mit Stimmzettel-Nummer ${ballot.ballotIdentifier} wurde bereits erfasst`);
        }
    }
}

