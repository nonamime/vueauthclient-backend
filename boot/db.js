var db = require('../db');


export default  db = function () {

  db.serialize(function () {
    db.run("CREATE TABLE IF NOT EXISTS user ( \
      userid INTEGER PRIMARY KEY AUTOINCREMENT,\
      username TEXT UNIQUE,\
      name TEXT ,\
      role TEXT,\
      password BLOB,\
      salt BLOB,\
      confirm_password BLOB\
    )");
    db.run("CREATE TABLE IF NOT EXISTS employee ( \
      employeeid INTEGER PRIMARY KEY AUTOINCREMENT,\
      employeename TEXT UNIQUE,\
      userid INTEGER UNIQUE,\
      FOREIGN KEY (userid) REFERENCES user(userid) \
    )");
    db.run("CREATE TABLE IF NOT EXISTS project ( \
      projectid INTEGER PRIMARY KEY AUTOINCREMENT,\
      projectname TEXT UNIQUE,\
      projectaddress TEXT \
    )");
    db.run("CREATE TABLE IF NOT EXISTS team ( \
      teamid INTEGER PRIMARY KEY AUTOINCREMENT, \
      teamname TEXT UNIQUE,\
      description TEXT ,\
      projectid INTEGER,\
      FOREIGN KEY (projectid) REFERENCES project(projectid) \
      )");

    db.run("CREATE TABLE IF NOT EXISTS team_member ( \
      id INTEGER PRIMARY KEY,\
      teamid INTEGER, \
      roleid INTEGER,\
      employeeid INTEGER, \
      projectid INTEGER,\
      FOREIGN KEY (teamid) REFERENCES team(teamid), \
      FOREIGN KEY (roleid) REFERENCES roles(roleid), \
      FOREIGN KEY (employeeid) REFERENCES employee(employeeid), \
      FOREIGN KEY (projectid) REFERENCES project(projectid) \
      )");

    db.run("CREATE TABLE IF NOT EXISTS roles ( \
      roleid INTEGER PRIMARY KEY AUTOINCREMENT, \
      rolename TEXT UNIQUE,\
      description TEXT \
      )");

    db.run("CREATE TABLE IF NOT EXISTS worker_time ( \
      workertimeid INTEGER PRIMARY KEY AUTOINCREMENT,\
      teamid INTEGER, \
      projectid INTEGER,\
      employeeid INTEGER, \
      datein TEXT,\
      clockin TEXT,\
      dateout TEXT,\
      clockout TEXT,\
      FOREIGN KEY (teamid) REFERENCES team(teamid), \
      FOREIGN KEY (employeeid) REFERENCES employee(employeeid), \
      FOREIGN KEY (projectid) REFERENCES project(projectid) ,\
      UNIQUE (teamid, projectid, employeeid, datein) \
      )");
    // db.run("CREATE TABLE IF NOT EXISTS supervisor ( \
    //   supervisorid INTEGER PRIMARY KEY AUTOINCREMENT,\
    //   projectid INTEGER,\
    //   userid INTEGER, \
    //   teamid INTEGER, \
    //   FOREIGN KEY (userid) REFERENCES user(userid), \
    //   FOREIGN KEY (projectid) REFERENCES project(projectid) \
    // )");
    // db.run("CREATE TABLE IF NOT EXISTS worker ( \
    //   workerid INTEGER PRIMARY KEY AUTOINCREMENT,\
    //   projectid INTEGER,\
    //   userid INTEGER, \
    //   supervisorid INTEGER,\
    //   teamid INTEGER, \
    //   FOREIGN KEY (userid) REFERENCES user(userid), \
    //   FOREIGN KEY (supervisorid) REFERENCES supervisor(supervisorid), \
    //   FOREIGN KEY (projectid) REFERENCES project(projectid) \
    // )");
    //   db.run("CREATE TABLE IF NOT EXISTS team ( \
    //     teamnumber INTEGER PRIMARY KEY,\
    //     teamid INTEGER, \
    //     projectid INTEGER,\
    //     userid INTEGER, \
    //     supervisororworker INTEGER,\
    //     FOREIGN KEY (userid) REFERENCES user(userid), \
    //     FOREIGN KEY (projectid) REFERENCES project(projectid) \
    //   )");
  });



  //db.close();

};
