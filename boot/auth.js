var passport = require('passport');
var Strategy = require('passport-local');
var crypto = require('crypto');
var db = require('../db');
var CONSTANT = require('../const');
var ROLE = CONSTANT.ROLE;


module.exports = function () {

  // Configure the local strategy for use by Passport.
  //
  // The local strategy requires a `verify` function which receives the credentials
  // (`username` and `password`) submitted by the user.  The function must verify
  // that the password is correct and then invoke `cb` with a user object, which
  // will be set at `req.user` in route handlers after authentication.
  passport.use(new Strategy(function (username, password, done) {

    db.get('SELECT rowid AS id, username, role, name, password as dbHashedPassword, salt FROM user WHERE username = ?', [username], function (err, row) {
      if (err) { return done(err) }
      if (!row) { return done(null, false, { message: 'Incorrect username or password.' }) }

      crypto.pbkdf2(password, row.salt, 310000, 32, 'sha256', function (err, hashedPassword) {
        if (err) { return done(err); }
        if (!crypto.timingSafeEqual(row.dbHashedPassword, hashedPassword)) {
          return done(null, false, { message: 'Incorrect username or password.' })
        }

        if (row.role == 1) { //admin
          var user = {
            id: row.id.toString(),
            username: row.username,
            name: row.name,
            // role: row.role,
            role: ROLE.admin, // 1 = admin , 0 = normal user
            teamrole: 0,
          };
          return done(null, user)

        } else {
          //assign supervisor to a team when register if not teammember.roleid will be undefine value
          //db.all('select employee.employeeid,team_member.roleid FROM user JOIN employee ON user.userid = employee.userid JOIN team_member ON employee.employeeid = team_member.employeeid  WHERE employee.userid = ? order by roleid asc', [row.id], function (err, rows) {
          db.get('select count(1) as count FROM user JOIN employee ON user.userid = employee.userid JOIN team_member ON employee.employeeid = team_member.employeeid  WHERE team_member.roleid = 1 and  user.userid = ?', [row.id], function (err, supvisorCount) {

            var user = {
              id: row.id.toString(),
              username: row.username,
              name: row.name,
              role: ROLE.user,
              teamrole: supvisorCount.count > 0 ? 1 : 3,//check Role table for reference,
            };

            return done(null, user)
          });
        }
      });
    });
  }));


  // Configure Passport authenticated session persistence.
  //
  // In order to restore authentication state across HTTP requests, Passport needs
  // to serialize users into and deserialize users out of the session.  The
  // typical implementation of this is as simple as supplying the user ID when
  // serializing, and querying the user record by ID from the database when
  // deserializing.
  passport.serializeUser(function (user, done) {
    process.nextTick(function () {
      done(null, user);
    });
  });

  passport.deserializeUser(function (user, done) {
    process.nextTick(function () {
      return done(null, user);
    });
  });

};
