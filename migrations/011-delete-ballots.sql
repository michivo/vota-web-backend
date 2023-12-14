--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE TempBallot (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  countingUserId   INTEGER NOT NULL,
  additionalPeople TEXT NULL,
  dateCreatedUtc   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  electionId       INTEGER NOT NULL,
  ballotStation    TEXT NULL,
  ballotIdentifier TEXT NULL,
  isValid          INTEGER NOT NULL,
  notes            TEXT NULL,
  isDeleted        INTEGER NOT NULL DEFAULT 0,
  deleteUserId     INTEGER NULL,
  deleteReason     TEXT NULL,
  deleteDateUtc    DATETIME NULL,

  FOREIGN KEY (countingUserId) REFERENCES User(id) ON UPDATE CASCADE
  FOREIGN KEY (electionId) REFERENCES Elecetion(id) ON UPDATE CASCADE
  FOREIGN KEY (deleteUserId) REFERENCES User(id) ON UPDATE CASCADE
);

INSERT INTO TempBallot SELECT id, countingUserId, additionalPeople, dateCreatedUtc, electionId, ballotStation, ballotIdentifier, isValid, notes, 0, NULL, NULL, NULL FROM Ballot;

DROP TABLE Ballot;

ALTER TABLE TempBallot RENAME TO Ballot;

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

CREATE TABLE TempBallot (
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
  FOREIGN KEY (electionId) REFERENCES Elecetion(id) ON UPDATE CASCADE
);

INSERT INTO TempBallot SELECT id, countingUserId, additionalPeople, dateCreatedUtc, electionId, ballotStation, ballotIdentifier, isValid, notes FROM Ballot;

DROP TABLE Ballot;

ALTER TABLE TempBallot RENAME TO Ballot;