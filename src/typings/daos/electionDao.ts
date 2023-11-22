import { ElectionState } from '../electionState'
import { ElectionType } from '../electionType'
import { CandidateDao } from './candidateDao'

export interface ElectionDao {
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
}

export interface ElectionWithCandidatesDao extends ElectionDao {
    candidates: CandidateDao[],
}