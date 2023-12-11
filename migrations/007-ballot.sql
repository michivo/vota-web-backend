--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE Ballot (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  countingUserId   INTEGER NOT NULL,
  additionalPeople TEXT NULL,
  dateCreatedUtc   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  electionId       INTEGER NOT NULL,
  ballotStation    TEXT NULL,
  ballotIdentifier TEXT NULL,
  isValid          INTEGER NOT NULL,
  notes            TEXT NULL,

  FOREIGN KEY (countingUserId) REFERENCES User(id) ON UPDATE CASCADE
  FOREIGN KEY (electionId) REFERENCES Election(id) ON UPDATE CASCADE
);

CREATE TABLE BallotItem (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ballotId    INTEGER NOT NULL,
    candidateId INTEGER NOT NULL,
    ballotOrder INTEGER NOT NULL,
    FOREIGN KEY (ballotId) REFERENCES Ballot(id) ON UPDATE CASCADE
    FOREIGN KEY (candidateId) REFERENCES Candidate(id) ON UPDATE CASCADE
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE Ballot;
DROP TABLE BallotItem;