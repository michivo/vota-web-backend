import { Gender } from "../gender"

export interface CandidateDao {
    id: number,
    ballotOrder: number,
    name: string,
    description: string | null | undefined,
    gender: Gender,
    electionId: number
}
