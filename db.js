const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const sqliteDbFilename = "newdb.sqlite3";

module.exports = new sqlite3.Database(sqliteDbFilename);

module.exports.awaitDb = open({
  filename: sqliteDbFilename,
  driver: sqlite3.Database,
});
