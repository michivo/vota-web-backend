export interface BallotInfoDto {
    id: number,
    countingUserId: number,
    countingUserName: string,
    additionalPeople: string,
    dateCreated: Date,
    electionId: number,
    ballotStation: string,
    ballotIdentifier: string,
    isValid: boolean,
    notes: string,
    isDeleted: boolean,
    deleteReason?: string | null,
    deleteUserName?: string | null,
    deleteUserId?: number,
    dateDeleted?: Date,
    canDelete: boolean,
}

export interface BallotItemDto {
    id: number,
    ballotId: number,
    candidateId: number,
    candidateName: string,
    order: number,
}

export interface BallotWithVotesDto extends BallotInfoDto {
    votes: BallotItemDto[],
}
