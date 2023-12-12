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

  FOREIGN KEY (countingUserId) REFERENCES User(id) ON UPDATE CASCADE
  FOREIGN KEY (electionId) REFERENCES Election(id) ON UPDATE CASCADE
);

INSERT INTO TempBallot SELECT * FROM Ballot;

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

INSERT INTO TempBallot SELECT * FROM Ballot;

DROP TABLE Ballot;

ALTER TABLE TempBallot RENAME TO Ballot;