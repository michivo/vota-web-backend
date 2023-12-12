export interface VotaResultData {
    success: boolean,
    errorLog: string,
    detailedLog: string,
    protocol: VotaProtocol | undefined,
    stats: string | undefined,
}

export interface VotaProtocol {
    Title: string,
    Messages: Array<string | VotaProtocol>,
    Result: Array<string>,
}
