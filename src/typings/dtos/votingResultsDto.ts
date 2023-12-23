import { ElectionState } from '../electionState';
import { VotaProtocol } from '../votaResultData';

export interface VotingResultsDto {
    electionTitle: string,
    electionState: ElectionState,
    results: VotingResultDto[],
}

export interface VotingResultDto {
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
    username: string,
}
