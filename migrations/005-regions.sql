--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE Region (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  regionName   TEXT    NOT NULL
);


CREATE TABLE UserRegion (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  regionId     INTEGER NOT NULL,
  userId       INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON UPDATE CASCADE,
  FOREIGN KEY (regionId) REFERENCES Region(id) ON UPDATE CASCADE
);

INSERT INTO Region (id, regionName) VALUES (1, 'Wien');
INSERT INTO UserRegion (regionId, userId) SELECT 1, id FROM USER;

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE UserRegion;
DROP TABLE Region;