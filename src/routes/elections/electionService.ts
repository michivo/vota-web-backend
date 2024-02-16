import { Database } from 'sqlite';
import { openDb } from '../../infrastructure/database';
import { BadRequestError, NotFoundError } from '../../infrastructure/errors';
import { CandidateDao } from '../../typings/daos/candidateDao';
import { ElectionDao } from '../../typings/daos/electionDao';
import { CandidateDto } from '../../typings/dtos/candidateDto';
import { ElectionDto, ElectionWithCandidatesDto } from '../../typings/dtos/electionDto';
import { ElectionState } from '../../typings/electionState';
import { CountElectionRequest } from '../../typings/dtos/countElectionRequest';
import { countVotes } from '../../infrastructure/vota';
import { BallotWithVotesDao } from '../../typings/daos/ballotWithVotesDao';
import { getCsvData } from '../../infrastructure/csvService';
import { VotingResultsDao } from '../../typings/daos/votingResultsDao';
import { VotingResultDto, VotingResultsDto } from '../../typings/dtos/votingResultsDto';
import { toUtcDate } from '../../helpers/dateHelper';

export class ElectionService {
    getElectionsForUser = async (userId: number): Promise<ElectionDto[]> => {
        const db = await openDb();
        try {
            const results = await db.all('SELECT * FROM Election WHERE createUserId = (?)', userId);
            const elections = results.map(e => e as ElectionDao);
            return elections.map(this.mapToElectionDto);
        }
        finally {
            db.close();
        }
    }

    getElectionsByState = async (state: ElectionState): Promise<ElectionDto[]> => {
        const db = await openDb();
        try {
            const results = await db.all('SELECT * FROM Election WHERE electionState = (?)', state);
            const elections = results.map(e => e as ElectionDao);
            return elections.map(this.mapToElectionDto);
        }
        finally {
            db.close();
        }
    }

    getAllElections = async (): Promise<ElectionDto[]> => {
        const db = await openDb();
        try {
            const results = await db.all('SELECT * FROM Election');
            const elections = results.map(e => e as ElectionDao);
            return elections.map(this.mapToElectionDto);
        }
        finally {
            db.close();
        }
    }

    getElection = async (electionId: number): Promise<ElectionWithCandidatesDto> => {
        const db = await openDb();
        try { // TODO make a join?
            const result = await db.get('SELECT * FROM Election WHERE id = (?)', electionId);
            if (!result) {
                throw new NotFoundError(`Wahl mit Id ${electionId} konnte nicht gefunden werden.`);
            }

            const candidates = await db.all('SELECT * FROM Candidate WHERE electionId = (?)', electionId);
            const election = result as ElectionDao;
            const candidateDaos = candidates.map(c => c as CandidateDao);

            return this.mapToElectionWithCandidatesDto(election, candidateDaos);
        }
        finally {
            db.close();
        }
    }

    createElection = async (election: ElectionDto, userId: number): Promise<number | undefined> => {
        const db = await openDb();
        try { // TODO user id check needed?
            console.debug(`inserting election${JSON.stringify(election)}`);
            const result = await db.run('INSERT INTO Election ' +
                '( title,  description,  createUserId,  dateCreated,  enforceGenderParity,  electionType,  electionState,  alreadyElectedFemale,  alreadyElectedMale,  numberOfPositionsToElect) VALUES ' +
                '($title, $description, $createUserId, $dateCreated, $enforceGenderParity, $electionType, $electionState, $alreadyElectedFemale, $alreadyElectedMale, $numberOfPositionsToElect)', {
                $title: election.title,
                $description: election.description,
                $createUserId: userId,
                $dateCreated: new Date(),
                $enforceGenderParity: election.enforceGenderParity,
                $electionType: election.electionType,
                $alreadyElectedFemale: election.alreadyElectedFemale,
                $alreadyElectedMale: election.alreadyElectedMale,
                $numberOfPositionsToElect: election.numberOfPositionsToElect,
                $electionState: ElectionState.Creating,
            });
            console.debug(`inserted election with id ${result.lastID}`);
            return result.lastID;
        }
        finally {
            db.close();
        }
    }

    updateElection = async (election: ElectionWithCandidatesDto): Promise<void> => {
        const db = await openDb(); // TODO transaction handling?
        try {
            await db.run('UPDATE Election SET ' +
                'title = $title, ' +
                'description = $description, ' +
                'enforceGenderParity = $enforceGenderParity, ' +
                'electionType = $electionType, ' +
                'electionState = $electionState, ' +
                'alreadyElectedFemale = $alreadyElectedFemale, ' +
                'alreadyElectedMale = $alreadyElectedMale, ' +
                'numberOfPositionsToElect = $numberOfPositionsToElect WHERE ' +
                'Election.id = $electionId', {
                $title: election.title,
                $description: election.description,
                $enforceGenderParity: election.enforceGenderParity,
                $electionType: election.electionType,
                $electionState: election.electionState,
                $alreadyElectedFemale: election.alreadyElectedFemale,
                $alreadyElectedMale: election.alreadyElectedMale,
                $numberOfPositionsToElect: election.numberOfPositionsToElect,
                $electionId: election.id,
            });
            if (election.candidates) {
                await db.run('DELETE FROM Candidate WHERE electionId = $electionId', {
                    $electionId: election.id,
                });
                for (const candidate of election.candidates) {
                    this.addCandidate(candidate, election.id, db);
                }
            }
        }
        finally {
            db.close();
        }
    }

    addCandidate = async (candidate: CandidateDto, electionId: number, database: Database | undefined = undefined): Promise<number | undefined> => {
        const db = database || await openDb();
        try {
            const result = await db.run('INSERT INTO Candidate (ballotOrder, name, description, gender, electionId) VALUES ' +
                '($ballotOrder, $name, $description, $gender, $electionId)', {
                $ballotOrder: candidate.ballotOrder,
                $name: candidate.name,
                $description: candidate.description,
                $gender: candidate.gender,
                $electionId: electionId,
            });
            return result.lastID;
        }
        finally {
            if (!database) {
                db.close();
            }
        }
    }

    removeCandidate = async (candidateId: number, electionId: number) => {
        const db = await openDb();
        try {
            await db.run('DELETE FROM Candidate WHERE id = $candidateId AND electionId = $electionId', {
                $candidateId: candidateId,
                $electionId: electionId,
            });
        }
        finally {
            db.close();
        }
    }

    updateCandidates = async (candidates: CandidateDto[], electionId: number) => {
        if (!candidates || candidates.length === 0) {
            return;
        } // TODO transaction handling, success verification?
        const db = await openDb();
        try {
            console.debug(`Updating candidates for election ${electionId}`);
            for (const candidate of candidates) {
                await db.run('UPDATE Candidate SET ballotOrder = $ballotOrder, name = $name, ' +
                    'description = $description, gender = $gender WHERE ' +
                    'Candidate.id = $candidateId AND Candidate.electionId = $electionId', {
                    $ballotOrder: candidate.ballotOrder,
                    $name: candidate.name.trim(),
                    $description: candidate.description,
                    $gender: candidate.gender,
                    $candidateId: candidate.id,
                    $electionId: electionId,
                });
            }
        }
        finally {
            db.close();
        }
    }

    deleteElection = async (electionId: number) => {
        const db = await openDb();
        try {
            const result = await db.get('SELECT * FROM Election WHERE id = (?)', electionId);
            if (!result) {
                throw new NotFoundError(`Wahl mit Id ${electionId} konnte nicht gefunden werden.`);
            }

            const election = result as ElectionDao;
            if (election.electionState !== ElectionState.Creating) {
                throw new BadRequestError(`Wahl mit Id ${electionId} wurde bereits freigeschaltet und kann nicht gelöscht werden.`);
            }
            await db.run('DELETE FROM Election WHERE id = (?)', electionId);
        } finally {
            db.close();
        }
    }

    countVotes = async (electionId: number, userId: number, request: CountElectionRequest) => {
        const db = await openDb();
        try { // TODO make a join?
            const result = await db.get('SELECT * FROM Election WHERE id = (?)', electionId);
            if (!result) {
                throw new NotFoundError(`Wahl mit Id ${electionId} konnte nicht gefunden werden.`);
            }
            if (!request.isTestRun) {
                const existingResultQuery = await db.get('SELECT id FROM VotingResults WHERE electionId = (?) AND resultStatus = 0 AND success = 1');
                if (existingResultQuery && !request.overrideReason) {
                    throw new BadRequestError('Wenn ein Wahlergebnis übeschrieben werden soll, muss ein Grund angegeben werden.');
                }

                await db.run('UPDATE VotingResults SET resultStatus = 2, overrideUserId = $userId, overrideDateUtc = $overrideDate, overrideReason = $overrideReason WHERE electionId = $electionId AND resultStatus = 0 AND success = 1',
                    {
                        $userId: userId,
                        $overrideDate: new Date(),
                        $electionId: electionId,
                        $overrideReason: request.overrideReason,
                    });

                await db.run('UPDATE Election SET ' +
                    'electionState = $electionState, WHERE ' +
                    'Election.id = $electionId', {
                    $electionState: ElectionState.ResultsOfficial,
                    $electionId: electionId,
                });
            }

            const candidates = await db.all('SELECT * FROM Candidate WHERE electionId = (?)', electionId);
            const election = result as ElectionDao;
            const candidateDaos = candidates.map(c => c as CandidateDao);

            const results = await db.all('SELECT Ballot.id as ballotId, Ballot.ballotIdentifier, BallotItem.candidateId, BallotItem.ballotOrder ' +
                ' FROM Ballot LEFT JOIN BallotItem ON BallotItem.ballotId = Ballot.id WHERE Ballot.isValid = 1 AND Ballot.isDeleted = 0 AND Ballot.electionId = (?)', electionId);
            const ballots = results.map(e => e as BallotWithVotesDao);

            const csvData = getCsvData(candidateDaos, ballots, election.enforceGenderParity);

            const invalidCountQuery = await db.get('SELECT COUNT(*) AS invalidCount FROM Ballot WHERE Ballot.isValid = 0 AND Ballot.isDeleted = 0 AND Ballot.electionId = (?)', electionId);
            console.error(invalidCountQuery.invalidCount);

            const votingResult = await countVotes(csvData, invalidCountQuery.invalidCount, election);

            const dbSaveResult = await db.run('INSERT INTO VotingResults (electionId, userId, resultStatus, success, errorLog, detailedLog, protocol, ' +
                'protocolFormatVersion, voterListCsv, votesCsv, statsData) VALUES ' +
                '($electionId, $userId, $resultStatus, $success, $errorLog, $detailedLog, $protocol, $protocolFormatVersion, $voterListCsv, $votesCsv, $statsData)', {
                $electionId: electionId,
                $userId: userId,
                $resultStatus: request.isTestRun ? 1 : 0,
                $success: votingResult.success,
                $errorLog: votingResult.errorLog,
                $detailedLog: votingResult.detailedLog,
                $protocol: JSON.stringify(votingResult.protocol),
                $protocolFormatVersion: 1,
                $voterListCsv: csvData.voterList,
                $votesCsv: csvData.votes,
                $statsData: votingResult.stats,
            });
            return dbSaveResult.lastID;
        }
        catch (err: unknown) {
            console.error(err);
        }
        finally {
            db.close();
        }
    }

    getResults = async (electionId: number): Promise<VotingResultsDto> => {
        const db = await openDb();
        try {
            const electionInfo = await db.get('SELECT id, title, electionState FROM Election WHERE id = (?)', electionId);
            if (!electionInfo) {
                throw new NotFoundError(`Wahl mit Id ${electionId} konnte nicht gefunden werden.`);
            }

            const results = await db.all('SELECT VotingResults.id, VotingResults.electionId, VotingResults.userId, VotingResults.resultStatus, ' +
                ' VotingResults.dateCreatedUtc, VotingResults.success, VotingResults.errorLog, VotingResults.detailedLog, VotingResults.protocolFormatVersion, ' +
                ' VotingResults.protocol, VotingResults.voterListCsv, VotingResults.votesCsv, VotingResults.statsData, VotingResults.overrideReason, VotingResults.overrideDateUtc, ' +
                ' User.username as username, User.fullName as fullName, overrideUser.username as overrideUsername, overrideUser.fullName as overrideUserFullName FROM VotingResults ' +
                ' INNER JOIN User on User.id = VotingResults.userId LEFT JOIN User overrideUser ON overrideUser.id = VotingResults.overrideUserId WHERE electionId = (?)', electionId);
            const votingResults = results as Array<VotingResultsDao & { username: string, fullName: string, title: string, overrideUsername: string, overrideUserFullName: string, overrideDateUtc: number }>;
            console.log(votingResults.map(v => v.overrideDateUtc));
            const votingResultDtos: VotingResultDto[] = votingResults.map(v => ({
                id: v.id,
                electionId: v.electionId,
                userId: v.userId,
                resultStatus: v.resultStatus,
                dateCreatedUtc: toUtcDate(v.dateCreatedUtc),
                success: v.success,
                errorLog: v.errorLog,
                detailedLog: v.detailedLog,
                protocol: JSON.parse(v.protocol),
                protocolFormatVersion: v.protocolFormatVersion,
                voterListCsv: v.voterListCsv,
                votesCsv: v.votesCsv,
                statsData: v.statsData,
                username: v.fullName || v.username,
                overrideReason: v.overrideReason,
                overrideUser: v.overrideUserFullName || v.overrideUsername,
                overrideDateUtc: new Date(v.overrideDateUtc),
            }));
            console.log(votingResultDtos.map(v => v.overrideDateUtc));

            return {
                electionTitle: electionInfo.title,
                electionState: electionInfo.electionState,
                results: votingResultDtos,
            }
        }
        finally {
            db.close();
        }
    }

    private mapToElectionDto(election: ElectionDao): ElectionDto {
        return {
            id: election.id,
            title: election.title,
            description: election.description,
            createUserId: election.createUserId,
            dateCreated: new Date(election.dateCreated),
            enforceGenderParity: election.enforceGenderParity,
            electionType: election.electionType,
            electionState: election.electionState,
            alreadyElectedFemale: election.alreadyElectedFemale,
            alreadyElectedMale: election.alreadyElectedMale,
            numberOfPositionsToElect: election.numberOfPositionsToElect,
        };
    }

    private mapToElectionWithCandidatesDto(election: ElectionDao, candidates: CandidateDao[] = []): ElectionWithCandidatesDto {
        const electionDto = { ...this.mapToElectionDto(election), candidates: candidates.map(c => this.mapToCandidateDto(c, election.id)) };
        return electionDto;
    }

    private mapToCandidateDto(c: CandidateDao, electionId: number): CandidateDto {
        return {
            id: c.id,
            ballotOrder: c.ballotOrder,
            name: c.name,
            description: c.description,
            gender: c.gender,
            electionId: electionId,
        };
    }
}
