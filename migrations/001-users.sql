--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS Greeting (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);

CREATE TABLE User (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  roleId       INTEGER NOT NULL,
  username     TEXT    NOT NULL,
  email        TEXT    NULL,
  isActive     NUMERIC NOT NULL DEFAULT 1,
  fullName     TEXT    NULL,
  passwordHash TEXT    NOT NULL,
  passwordSalt TEXT    NOT NULL
);

INSERT INTO User (id, roleId, username, isActive, passwordHash, passwordSalt) VALUES (1, 1, 'admin', 1, '$2b$10$yfSgvvjXmqwX5jd/rE27deGzuSfMiTm206gf9tiYZYS.8Ziuv3Nga', '$2b$10$yfSgvvjXmqwX5jd/rE27de');

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE Greeting;
DROP TABLE User;