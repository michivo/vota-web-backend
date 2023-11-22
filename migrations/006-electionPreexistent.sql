--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

ALTER TABLE Election ADD alreadyElectedFemale INTEGER NOT NULL DEFAULT 0;
ALTER TABLE Election ADD alreadyElectedMale INTEGER NOT NULL DEFAULT 0;

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

ALTER TABLE Election DROP COLUMN alreadyElectedFemale;
ALTER TABLE Election DROP COLUMN alreadyElectedMale;