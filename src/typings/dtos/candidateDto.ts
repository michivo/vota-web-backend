import { Gender } from "../gender"

export interface CandidateDto {
    id: number,
    ballotOrder: number,
    name: string,
    description: string | null | undefined,
    gender: Gender,
    electionId: number
}
