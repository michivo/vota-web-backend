export interface BallotItemDao {
    id: number,
    ballotId: number,
    candidateId: number,
    ballotOrder: number,
}

// id          INTEGER PRIMARY KEY AUTOINCREMENT,
// ballotId    INTEGER NOT NULL,
// candidateId INTEGER NOT NULL,
// ballotOrder       INTEGER NOT NULL,
// FOREIGN KEY (ballotId) REFERENCES Ballot(id) ON UPDATE CASCADE
// FOREIGN KEY (candidateId) REFERENCES Candidate(id) ON UPDATE CASCADE
