--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE Election (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT    NOT NULL,
  description  TEXT    NULL,
  createUserId INTEGER NOT NULL,
  dateCreated  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  enforceGenderParity INTEGER NOT NULL DEFAULT 1,
  electionType INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (createUserId) REFERENCES User(id) ON UPDATE CASCADE
);

CREATE TABLE Candidate (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ballotOrder INTEGER NOT NULL DEFAULT 0,
    name        TEXT    NOT NULL,
    description TEXT    NULL,
    gender      INTEGER NOT NULL,
    electionId  INTEGER NOT NULL,
    FOREIGN KEY (electionId) REFERENCES Election(id) ON UPDATE CASCADE
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE Election;
DROP TABLE Candidate;