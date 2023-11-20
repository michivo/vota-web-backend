--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE PasswordReset (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  challenge    TEXT    NOT NULL,
  userId INTEGER NOT NULL,
  dateCreated  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id) ON UPDATE CASCADE
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE PasswordReset;