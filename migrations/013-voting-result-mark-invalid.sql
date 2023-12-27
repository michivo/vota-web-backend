--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

ALTER TABLE VotingResults ADD resultStatus INT NOT NULL DEFAULT 0;
ALTER TABLE VotingResults ADD overrideUserId INT NULL;
ALTER TABLE VotingResults ADD overrideDateUtc DATETIME NULL;
UPDATE VotingResults SET resultStatus = 1 WHERE isTestRun = 1;
ALTER TABLE VotingResults DROP COLUMN isTestRun;

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

ALTER TABLE VotingResults DROP COLUMN resultStatus;
ALTER TABLE VotingResults DROP COLUMN overrideUserId;
ALTER TABLE VotingResults DROP COLUMN overrideDateUtc;
ALTER TABLE VotingResults ADD isTestRun NUMERIC NOT NULL DEFAULT 1;
UPDATE VotingResults SET isTestRun = 1 WHERE resultStatus != 1;