var express = require("express");
var passport = require("passport");
var crypto = require("crypto");
const LocalStrategy = require("passport-local").Strategy;
var ensureLoggedIn = require("connect-ensure-login").ensureLoggedIn;
var db = require("../db");

var awaitDb;
(async () => {
  try {
    awaitDb = await db.awaitDb;
    console.log("loaded await db library");
  } catch (e) {}
})();

var router = express.Router();
const isTeamSupervisor = require("./authMiddleware").isTeamSupervisor;

var CONSTANT = require("../const");
var TEAM = CONSTANT.TEAM;

/* GET users listing. */

router.post("/api/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(400).send([user, "Cannot log in", info]);
    }

    req.login(user, (err) => {
      res.send(user);
    });
  })(req, res, next);
});

router.post("/api/register", function (req, res, next) {
  var salt = crypto.randomBytes(16); //todo remove confirm password from db, 2. add check confirm password against password logic
  crypto.pbkdf2(
    req.body.password,
    salt,
    310000,
    32,
    "sha256",
    function (err, hashedPassword) {
      if (err) {
        return next(err);
      }
      crypto.pbkdf2(
        req.body.confirm_password,
        salt,
        310000,
        32,
        "sha256",
        function (err, hashedConfirmPassword) {
          if (err) {
            return next(err);
          }

          db.run(
            "INSERT INTO user (username,name,role,password,confirm_password,salt) VALUES (?, ?, ?, ?, ?, ?)",
            [
              req.body.username,
              req.body.name,
              req.body.role == "Admin" ? 1 : 0,
              hashedPassword,
              hashedConfirmPassword,
              salt,
            ],
            function (err) {
              if (err) {
                return next(err);
              }

              res.sendStatus(200);
            }
          );
        }
      );
    }
  );
});

router.post("/api/registeremployee", function (req, res, next) {
  db.run(
    "INSERT INTO employee (employeename, userid) VALUES (?, ?)",
    [req.body.nickname, req.body.userid],
    function (err) {
      if (err) {
        console.log("/api/registeremployee", err);
        return res.sendStatus(500);
      }
      res.sendStatus(200);
    }
  );
});

router.post("/api/registerproject", function (req, res, next) {
  db.run(
    "INSERT INTO project (projectname,projectaddress) VALUES (?, ?)",
    [req.body.projectname, req.body.projectadddress],
    function (err) {
      if (err) {
        return next(err);
      }
      var project = {
        id: this.lastID.toString(),
        projectname: req.body.projectname,
        projectaddress: req.body.projectaddress,
      };
      req.login(project, function (err) {
        if (err) {
          return next(err);
        }
        res.send("Register Project Done");
      });
    }
  );
});

router.post("/api/assignproject", function (req, res, next) {
  db.run(
    "INSERT INTO team (teamname, description, projectid) VALUES (?, ?, ?)",
    [req.body.team, req.body.team, req.body.projectid],
    function (err) {
      if (err) {
        return next(err);
      } else {
        const teamid = this.lastID;
        console.log("---------------", teamid, req.body.workerid);
        for (let i = 0; i < req.body.workerid.length; i++) {
          db.run(
            "INSERT INTO team_member (teamid, roleid, employeeid, projectid) VALUES (?, ?, ?, ?)",
            [teamid, TEAM.user, req.body.workerid[i], req.body.projectid],
            function (err) {
              if (err) {
                return next(err);
              }
            }
          );
        }
      }
      res.sendStatus(200);
    }
  );
});

router.post("/api/assignsupervisor", function (req, res, next) {
  db.run(
    "UPDATE team_member SET roleid = 1 WHERE teamid = ? AND employeeid = ?",
    [req.body.team, req.body.workerid],
    function (err) {
      if (err) {
        return next(err);
      }

      res.sendStatus(200);
    }
  );
});
// update team name
router.post("/api/updateteamname", function (req, res, next) {
  console.log(req.body);
  db.run(
    "UPDATE team SET teamname = ? , description = ? WHERE teamid = ?",
    [req.body.teamname, req.body.teamdescription, req.body.teamid],
    function (err) {
      if (err) {
        console.log("error");
        return next(err);
      }
    }
  );
});
// update team member
router.post("/api/updateteammember", function (req, res, next) {
  console.log(req.body);
  db.run(
    "DELETE FROM team_member  WHERE teamid = ? AND roleid = 3",
    [req.body.teamid],
    function (err) {
      if (err) {
        console.log("error");
        return next(err);
      }
    }
  );
  for (let i = 0; i < req.body.workerid.length; i++) {
    console.log(req.body.workerid[i]);
    db.run(
      "INSERT INTO team_member (teamid,roleid,employeeid,projectid) VALUES (?, 3, ?, ?)",
      [req.body.teamid, req.body.workerid[i], req.body.projectid],
      function (err) {
        if (err) {
          return next(err);
        }
      }
    );
    res.end();
  }
});

router.post("/api/insertworkertime", function (req, res, next) {
  console.log("insert worker timesheet", req.body.workerid);
  for (let i = 0; i < req.body.workerid.length; i++) {
    //console.log(req.body.workerid[i],)
    db.run(
      "INSERT INTO worker_time (teamid,projectid,employeeid,datein,clockin,dateout,clockout) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        req.body.teamid,
        req.body.projectid,
        req.body.workerid[i],
        req.body.datein,
        req.body.timein,
        req.body.dateout,
        req.body.timeout,
      ],
      function (err) {
        if (err) {
          // return res.send("Register Project Done");
        }
      }
    );
  }
  res.json({ data: "Register Project Done" });
});

router.post("/api/deleteteammember", function (req, res, next) {
  console.log(req.body);

  for (let i = 0; i < req.body.workerid.length; i++) {
    console.log(req.body.workerid[i]);
    db.run(
      "DELETE FROM team_member  WHERE teamid = ? AND employeeid = ?",
      [req.body.teamid, req.body.workerid[i]],
      function (err) {
        if (err) {
          console.log("error");
          return next(err);
        }
      }
    );
    res.end();
  }
});

router.post("/api/insertteammember", function (req, res, next) {
  console.log(req.body);
  for (let i = 0; i < req.body.workerid.length; i++) {
    console.log(req.body.workerid[i]);
    db.run(
      "INSERT INTO team_member (teamid,roleid,employeeid,projectid) VALUES (?, ?, ?, ?)",
      [req.body.teamid, TEAM.user, req.body.workerid[i], req.body.projectid],
      function (err) {
        if (err) {
          console.log("error", err);
          return next(err);
        }
      }
    );
    res.end();
  }
});

router.post("/api/deleteteamsupervisor", function (req, res, next) {
  console.log(req.body);
  for (let i = 0; i < req.body.workerid.length; i++) {
    console.log(req.body.workerid[i]);
    db.run(
      "UPDATE team_member SET roleid = 3 WHERE teamid = ? AND employeeid = ?",
      [req.body.teamid, req.body.workerid[i]],
      function (err) {
        if (err) {
          console.log("error");
          return next(err);
        }
      }
    );
    res.end();
  }
});

router.post("/api/insertteamsupervisor", function (req, res, next) {
  console.log(req.body);
  for (let i = 0; i < req.body.workerid.length; i++) {
    console.log(req.body.workerid[i]);
    db.run(
      "UPDATE team_member SET roleid = 1 WHERE teamid = ? AND employeeid = ?",
      [req.body.teamid, req.body.workerid[i]],
      function (err) {
        if (err) {
          console.log("error");
          return next(err);
        }
      }
    );
    res.end();
  }
});

router.get("/api/user", function (req, res, next) {
  if (!req.user) {
    return res.sendStatus(401);
  }

  res.send({ user: req.user });
});

router.get(
  "/api/supervisor",
  ensureLoggedIn(),
  isTeamSupervisor,
  function (req, res, next) {
    db.all(
      "select user.name,user.userid,team_member.teamid,project.projectname,team.teamname,team.description,team.projectid FROM TEAM JOIN project ON team.projectid = project.projectid JOIN team_member ON team_member.projectid = project.projectid JOIN user ON user.userid = team_member.employeeid WHERE team_member.roleid = 1 AND user.userid = ?",
      [req.user.id],
      function (err, row) {
        if (err) {
          console.log(err);
          return next(err);
        }
        console.log("/api/supervisor ", row);
        res.json(row);
      }
    );
  }
);

router.get(
  "/api/getTeam",
  ensureLoggedIn(),
  isTeamSupervisor,
  function (req, res, next) {
    db.all(
      `
    select
      team.teamid as id,
      team.teamname,
      team.description,
      project.projectname,
      user.userid
    FROM
      team_member
        LEFT JOIN team ON team.teamid = team_member.teamid
        LEFT JOIN project ON project.projectid = team.projectid
        LEFT JOIN employee on employee.employeeid = team_member.employeeid
        LEFT JOIN user ON user.userid = employee.userid
    WHERE
      team_member.roleid = 1
        AND user.userid = ?
    `,
      [req.user.id],
      function (err, rows) {
        if (err) {
          console.log(err);
          return next(err);
        }

        // console.log("/api/getTeam ", rows);
        res.json(rows);
      }
    );
  }
);

router.get(
  "/api/getTimeSheet",
  ensureLoggedIn(),
  isTeamSupervisor,
  function (req, res, next) {
    db.all(
      `
    SELECT
      team.teamid as id,
      team.teamname,
      team.description,
      project.projectname,
      user.userid,
      employee.employeeid,
      team_member.roleid
    FROM
      team_member
        LEFT JOIN team ON team.teamid = team_member.teamid
        LEFT JOIN project ON project.projectid = team.projectid
        LEFT JOIN employee on employee.employeeid = team_member.employeeid
        LEFT JOIN user ON user.userid = employee.userid
    WHERE
      team_member.roleid = 1
        AND user.userid = ?
    `,
      [req.user.id],
      function (err, rows) {
        if (err) {
          console.log(err);
          return next(err);
        }

        // console.log("/api/supervisor ", rows);
        res.json(rows);
      }
    );
  }
);

router.get("/api/reportlist", ensureLoggedIn(), function (req, res, next) {
  db.all(
    'SELECT * FROM worker_time Natural JOIN employee Natural JOIN project natural join team WHERE datein = DATE("now") order by projectname ASC, teamname ASC, datein ASC, clockin ASC ',
    function (err, row) {
      if (err) {
        console.log(err);
        return next(err);
      }
      console.log(row);
      res.json(row);
    }
  );
});

router.get("/api/user1", ensureLoggedIn(), function (req, res, next) {
  //console.log(req.user)
  db.get(
    "SELECT rowid AS id, username, name, role FROM user WHERE rowid = ?",
    [req.user.id],
    function (err, row) {
      if (err) {
        return next(err);
      }
      if (req.user.role == 1) {
        var role = "admin";
      } else {
        var role = "user";
      }
      var user = {
        id: row.id.toString(),
        username: row.username,
        displayName: row.name,
        role: role,
      };
      res.send({ user: user });
    }
  );
});

router.get("/api/projectname", function (req, res, next) {
  //console.log(req.user)
  db.all("SELECT * FROM project", function (err, row) {
    if (err) {
      console.log(err);
      return next(err);
    }
    //console.log(row)
    res.json(row);
  });
});

router.get("/api/workername", function (req, res, next) {
  //console.log(req.user)
  db.all("SELECT userid, name FROM user where role == 0", function (err, row) {
    if (err) {
      console.log(err);
      return next(err);
    }
    res.json(row);
  });
});

router.get("/api/employeename", function (req, res, next) {
  //console.log(req.user)
  db.all(
    "SELECT employee.employeeid, employee.employeename, user.userid, user.name FROM employee left join user on employee.userid = user.userid where employee.userid IS NOT NULL",
    function (err, row) {
      if (err) {
        console.log(err);
        return next(err);
      }
      //console.log(row)
      res.json(row);
    }
  );
});

router.get("/api/teamworkername", function (req, res, next) {
  //console.log(req.user)
  db.all(
    'SELECT * FROM user where role = "Supervisor" OR role = "User"',
    function (err, row) {
      if (err) {
        console.log(err);
        return next(err);
      }
      //console.log(row)
      res.json(row);
    }
  );
});

// for supervisor nameW
router.post("/api/filtersupervisor", function (req, res, next) {
  console.log(req.body.projectid);
  db.all(
    "select name,user.userid,teamid from team,user,project  where team.projectid = ?  and team.projectid = project.projectid  and user.userid = team.employeeid  and team.supervisororworker = 1",
    [req.body.projectid],
    function (err, row) {
      if (err) {
        console.log(err);
        return next(err);
      }
      //console.log(row)
      res.json(row);
    }
  );
});

router.post("/api/teamsupervisor", function (req, res, next) {
  //console.log(req.body.projectid)
  db.all(
    "select employee.employeename,employee.employeeid,team_member.teamid,project.projectname,team.teamname,team.description,team.projectid FROM TEAM JOIN project ON team.projectid = project.projectid JOIN team_member ON team_member.projectid = project.projectid JOIN employee ON team_member.employeeid = employee.employeeid WHERE team.teamid = ? AND team_member.roleid = 1 ORDER BY employee.employeeid ASC",
    [req.body.teamid],
    function (err, row) {
      if (err) {
        console.log(err);
        return next(err);
      }
      //console.log(row)
      res.json(row);
    }
  );
});

router.post("/api/filterteamworker", function (req, res, next) {
  console.log(req.body.teamid);
  db.all(
    `
    SELECT
      employee.employeename,
      employee.employeeid,
      team_member.teamid,
      project.projectname,
      team.teamname,
      team.description,
      team.projectid,
      employee.employeeid
    FROM
      TEAM
      LEFT JOIN project ON team.projectid = project.projectid
      LEFT JOIN team_member ON team_member.teamid = team.teamid
      JOIN employee ON team_member.employeeid = employee.employeeid
    WHERE
      team.teamid = ?
    ORDER BY
      employee.employeeid ASC
    `,
    [req.body.teamid],
    function (err, row) {
      if (err) {
        console.log(err);
        return next(err);
      }
      console.log(row);
      res.json(row);
    }
  );
});

router.get("/api/gettimesheetbysupervisor", function (req, res, next) {
  var teamIds = [];

  db.all(
    `
  SELECT
    team_member.teamid
  FROM
      team_member
  WHERE
      team_member.roleid = 1
      AND team_member.employeeid = ?
  `,
    [req.user.employee_id],
    function (err, row) {
      if (err) {
        console.log(err);
        return next(err);
      }

      if (row) {
        teamIds = row.map((x) => x.teamid);
      } else {
        res.sendStatus(400);
      }
      console.log("select timesheet from teams", teamIds);

      db.all(
        `
    SELECT
      worker_time.workertimeid as id,
      project.projectid,
      project.projectname,
      team.teamid,
      team.teamname,
      employee.employeename,
      worker_time.datein,
      worker_time.clockin,
      worker_time.dateout,
      worker_time.clockout
    FROM
        worker_time
        LEFT JOIN employee ON worker_time.employeeid = employee.employeeid
        LEFT JOIN team_member ON team_member.employeeid = worker_time.employeeid
          AND team_member.teamid = worker_time.teamid
        LEFT JOIN team on team_member.teamid = team.teamid
        LEFT JOIN project on team.projectid = project.projectid
    WHERE
        team_member.teamid IN (${teamIds
          .map(function () {
            return "?";
          })
          .join(",")})
        AND worker_time.datein >= date('now')
    ORDER By 
        worker_time.datein, project.projectname, team.teamname, employee.employeename
    `,
        teamIds,
        function (err, row2) {
          if (err) {
            console.log(err);
            return next(err);
          }

          res.json(row2);
        }
      );
    }
  );
});

router.post("/api/gettimesheet", async function (req, res, next) {
  if (!req.body.id) {
    return res.sendStatus(400);
  }
  const row = await awaitDb.get(
    `
  SELECT
    project.projectname,
    team.teamname,
    employee.employeename,
    workertimeid as id,
    datein,
    clockin,
    dateout, 
    clockout,
    remark
  FROM worker_time 
  LEFT JOIN employee ON employee.employeeid = worker_time.employeeid
  LEFT JOIN team ON team.teamid = worker_time.teamid 
  LEFT JOIN project ON team.projectid = project.projectid 
  WHERE worker_time.workertimeid = ?
  `,
    [req.body.id]
  );

  if (!row) {
    res.status(400);
    return res.json({
      msg: "No existing records found.",
    });
  }

  res.json(row);
});

router.post("/api/edittimesheet", async function (req, res, next) {
  if (req.body.remark) {
    const row = await awaitDb.get(
      `SELECT 
        projectid, 
        teamid, 
        employeeid
      FROM worker_time
      WHERE workertimeid = ? `,
      [req.body.id]
    );

    if (!row) {
      return res.sendStatus(400);
    }

    //update old record with remark
    await awaitDb.run(
      `
    UPDATE worker_time 
    SET 
      remark = ?
    WHERE 
      workertimeid = ?
      `,
      [req.body.remark, req.body.id]
    );

    console.log(row);
    //insert new line
    await awaitDb.run(
      "INSERT INTO worker_time (teamid,projectid,employeeid,datein,clockin,dateout,clockout, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        row.teamid,
        row.projectid,
        req.body.id,
        req.body.datein,
        req.body.timein,
        req.body.dateout,
        req.body.timeout,
      ]
    );

    res.sendStatus(200);
  } else {
    await awaitDb.run(
      `
  UPDATE worker_time 
  SET 
    datein = ?, 
    clockin = ?, 
    dateout = ?, 
    clockout = ? 
  WHERE 
    workertimeid = ?
    `,
      [
        req.body.datein,
        req.body.clockin,
        req.body.dateout,
        req.body.clockout,
        req.body.id,
      ]
    );
    res.sendStatus(200);
  }
});

router.post("/api/batchupdateendtime", async function (req, res, next) {
  if (
    !req.body.dateout ||
    !req.body.clockout ||
    !Array.isArray(req.body.timesheetIds) ||
    req.body.timesheetIds?.length == 0
  ) {
    return res.sendStatus(400);
  }

  timesheetIds = req.body.timesheetIds?.length > 0 ? req.body.timesheetIds : [];

  // console.log("inspect id", timesheetIds);

  const rows = await awaitDb.all(
    `
  SELECT 
    workertimeid as id,
    dateout, 
    clockout 
  FROM worker_time 
  WHERE worker_time.workertimeid IN (${timesheetIds.map(() => "?").join(",")})
  `,
    timesheetIds
  );

  var invalidTimesheetIds = [];
  var validTimesheetIds = [];

  for (const row of rows) {
    // console.log("inspect row", row);
    if (row.clockout || row.dateout) {
      invalidTimesheetIds.push(row.id);
    } else {
      validTimesheetIds.push(row.id);
    }
  }

  if (invalidTimesheetIds.length > 0) {
    res.status(400);
    return res.json({
      msg: "Record's End date/time has been set.",
      data: invalidTimesheetIds,
    });
  }

  if (validTimesheetIds.length == 0) {
    res.status(400);
    return res.json({
      msg: "No existing records found.",
    });
  }

  // console.log("change valid", validTimesheetIds);
  for (const timesheetId of validTimesheetIds) {
    // console.log("update timesheet", [
    //   req.body.dateout,
    //   req.body.clockout,
    //   timesheetId,
    // ]);
    await awaitDb.run(
      "UPDATE worker_time SET dateout = ? , clockout = ? WHERE workertimeid = ?",
      [req.body.dateout, req.body.clockout, timesheetId]
    );
  }
  res.sendStatus(200);
});

router.post("/api/getworkerdata", function (req, res, next) {
  console.log(req.body.projectid);
  db.all(
    "select username,name,projectname,project.projectid,team.teamid from team,user,project  where team.projectid = ? and team.teamid = ? and team.projectid = project.projectid  and user.userid = team.employeeid  and team.supervisororworker = 0",
    [req.body.projectid, req.body.teamid],
    function (err, row) {
      if (err) {
        console.log(err);
        return next(err);
      }
      //console.log(row)
      res.json(row);
    }
  );
});

router.post("/api/filterworker", function (req, res, next) {
  db.all(
    "select name,user.userid,team_member.teamid,projectname,teamname,description,team.projectid from team,user,project ,team_member   where team_member.teamid = ?   and team_member.projectid = project.projectid    and user.userid = team_member.employeeid  and team_member.roleid = 3",
    [req.body.teamid],
    function (err, row) {
      if (err) {
        console.log(err);
        return next(err);
      }
      //console.log(row)
      res.json(row);
    }
  );
});

router.post("/api/teaminfo", function (req, res, next) {
  db.all(
    "select team.teamid,project.projectname,team.teamname,team.description,team.projectid FROM TEAM JOIN project ON team.projectid = project.projectid WHERE team.teamid = ?",
    [req.body.teamid],
    function (err, row) {
      if (err) {
        console.log(err);
        return next(err);
      }
      //console.log(row)
      res.json(row);
    }
  );
});

// for worker name
router.get("/api/projectname", function (req, res, next) {
  //console.log(req.user)
  db.all("SELECT * FROM project", function (err, row) {
    if (err) {
      console.log(err);
      return next(err);
    }
    //console.log(row)
    res.json(row);
  });
});

router.get("/api/teamname", function (req, res, next) {
  //console.log(req.user)
  db.all("SELECT * FROM team", function (err, row) {
    if (err) {
      console.log(err);
      return next(err);
    }
    //console.log(row)
    res.json(row);
  });
});

router.get("/api/logout", function (req, res, next) {
  console.log("logged out");

  req.logOut();
  req.logout();

  res.send(req.user);
});

module.exports = router;
