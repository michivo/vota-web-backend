import { VotingResultStatus } from '../votingResultStatus';

export interface VotingResultsDao {
    id: number,
    electionId: number,
    userId: number,
    resultStatus: VotingResultStatus,
    dateCreatedUtc: string,
    success: boolean,
    errorLog: string,
    detailedLog: string,
    protocol: string,
    protocolFormatVersion: number,
    voterListCsv: string,
    votesCsv: string,
    statsData: string,
    overrideReason: string | undefined | null,
}

    /*    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    electionId     INTEGER NOT NULL,
    userId         INTEGER NOT NULL,
    isTestRun      NUMERIC NOT NULL DEFAULT 1,
    dateCreatedUtc DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    success        NUMERIC NOT NULL DEFAULT 1,
    errorLog       TEXT NULL,
    detailedLog    TEXT NOT NULL,
    protocol       TEXT NULL,
    protocolFormatVersion NUMERIC NOT NULL,
    voterListCsv   TEXT NOT NULL,
    votesCsv       TEXT NOT NULL,
    statsData      TEXT NOT NULL*/