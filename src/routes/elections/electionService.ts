import { openDb } from "../../infrastructure/database";
import { NotFoundError } from "../../infrastructure/errors";
import { CandidateDao } from "../../typings/daos/candidateDao";
import { ElectionDao } from "../../typings/daos/electionDao";
import { CandidateDto } from "../../typings/dtos/candidateDto";
import { ElectionDto, ElectionWithCandidatesDto } from "../../typings/dtos/electionDto";
import { ElectionState } from "../../typings/electionState";

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

    getElection = async (userId: number, electionId: number): Promise<ElectionWithCandidatesDto> => {
        const db = await openDb();
        try {
            const result = await db.get('SELECT * FROM Election WHERE id = (?) AND createUserId = (?)', electionId, userId);
            if (!result) {
                throw new NotFoundError(`Wahl mit Id {electionId} konnte nicht gefunden werden.`);
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
            console.debug('inserting election' + JSON.stringify(election));
            const result = await db.run('INSERT INTO Election ' + 
                '( title,  description,  createUserId,  dateCreated,  enforceGenderParity,  electionType,  electionState) VALUES ' +
                '($title, $description, $createUserId, $dateCreated, $enforceGenderParity, $electionType, $electionState)', {
                $title: election.title,
                $description: election.description,
                $createUserId: userId,
                $dateCreated: new Date(),
                $enforceGenderParity: election.enforceGenderParity,
                $electionType: election.electionType,
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
            await db.run('UPDATE Election SET title = $title, ' +
                'description = $description, enforceGenderParity = $enforceGenderParity, ' +
                'electionType = $electionType, electionState = $electionState WHERE ' +
                'Election.id = $electionId', {
                $title: election.title,
                $description: election.description,
                $enforceGenderParty: election.enforceGenderParity,
                $electionType: election.electionType,
                $electionState: ElectionState.Creating,
                $electionId: election.id,
            });
            if (election.candidates) {
                await this.updateCandidates(election.candidates, election.id);
            }
        }
        finally {
            db.close();
        }
    }

    addCandidate = async (candidate: CandidateDto, electionId: number): Promise<number | undefined> => {
        const db = await openDb();
        try {
            const result = await db.run('INSERT INTO Candidate (ballotOrder, name, description, gender, electionId) VALUES ' +
                '($ballotOrder, $name, $description, $gender, $electionId)', {
                $ballotOrder: candidate.ballotOrder,
                $name: candidate.name,
                $description: candidate.description,
                $gender: candidate.description,
                $electionId: electionId,
            });
            return result.lastID;
        }
        finally {
            db.close();
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
            for (const candidate of candidates) {
                await db.run('UPDATE Candidate SET ballotOrder = $ballotOrder, name = $name, ' +
                    'description = $description, gender = $gender WHERE' +
                    'Candidate.id = $candidateId AND Candidate.electionId = $electionId', {
                    $ballotOrder: candidate.ballotOrder,
                    $name: candidate.name,
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

    private mapToElectionDto(election: ElectionDao): ElectionDto {
        return {
            id: election.id,
            title: election.title,
            description: election.description,
            createUserId: election.createUserId,
            dateCreated: election.dateCreated,
            enforceGenderParity: election.enforceGenderParity,
            electionType: election.electionType,
            electionState: election.electionState,
        };
    }

    private mapToElectionWithCandidatesDto(election: ElectionDao, candidates: CandidateDao[] = []): ElectionWithCandidatesDto {
        const electionDto = { ...this.mapToElectionDto(election), ...{ candidates: candidates.map(c => this.mapToCandidateDto(c, election.id)) } };
        return electionDto;
    }

    private mapToCandidateDto(c: CandidateDao, electionId: number): CandidateDto {
        return {
            id: c.id,
            ballotOrder: c.ballotOrder,
            name: c.name,
            description: c.description,
            gender: c.gender,
            electionId: electionId
        };
    }
}
