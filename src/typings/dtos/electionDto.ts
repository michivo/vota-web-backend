import { ElectionState } from '../electionState';
import { ElectionType } from '../electionType';
import { CandidateDto } from './candidateDto';

export interface ElectionDto {
    id: number,
    title: string,
    description: string | undefined | null,
    createUserId: number,
    dateCreated: Date,
    enforceGenderParity: boolean,
    electionType: ElectionType,
    electionState: ElectionState,
    alreadyElectedMale: number,
    alreadyElectedFemale: number,
    numberOfPositionsToElect: number,
}

export interface ElectionWithCandidatesDto extends ElectionDto {
    candidates: CandidateDto[],
}