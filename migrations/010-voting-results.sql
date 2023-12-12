--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE VotingResults (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
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
    statsData      TEXT NOT NULL


    FOREIGN KEY (electionId) REFERENCES Election(id) ON UPDATE CASCADE
    FOREIGN KEY (userId) REFERENCES User(id) ON UPDATE CASCADE
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE VotingResults;
