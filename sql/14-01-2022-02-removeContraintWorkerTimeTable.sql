PRAGMA foreign_keys = off;

BEGIN TRANSACTION;

ALTER TABLE
    worker_time RENAME TO worker_time_old;

CREATE TABLE worker_time (
    workertimeid INTEGER PRIMARY KEY AUTOINCREMENT,
    teamid INTEGER,
    projectid INTEGER,
    employeeid INTEGER,
    datein TEXT,
    clockin TEXT,
    dateout TEXT,
    clockout TEXT,
    update_by TEXT,
    update_at TEXT,
    created_by TEXT,
    created_at TEXT,
    remark TEXT,
    FOREIGN KEY (teamid) REFERENCES team(teamid),
    FOREIGN KEY (employeeid) REFERENCES employee(employeeid),
    FOREIGN KEY (projectid) REFERENCES project(projectid)
);

INSERT INTO
    worker_time
SELECT
    *
FROM
    worker_time_old;

DROP TABLE worker_time_old;

COMMIT;

PRAGMA foreign_keys = on;