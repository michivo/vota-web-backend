import { VotaProtocol } from '../votaResultData';

export interface VotingResultsDto {
    id: number,
    electionId: number,
    userId: number,
    isTestRun: boolean,
    dateCreatedUtc: Date,
    success: boolean,
    errorLog: string,
    detailedLog: string,
    protocol: VotaProtocol,
    protocolFormatVersion: number,
    voterListCsv: string,
    votesCsv: string,
    statsData: string,
    electionName: string,
    username: string,
}
