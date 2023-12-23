export interface DeleteBallotRequest {
    ballotId: number,
    electionId: number,
    deleteReason: string,
}