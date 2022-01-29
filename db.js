import sqlite3 from "sqlite3";
import { open } from "sqlite";

const sqliteDbFilename = "newdb.sqlite3";

export const db = new sqlite3.Database(sqliteDbFilename);

export const awaitDb = open({
  filename: sqliteDbFilename,
  driver: sqlite3.Database,
});


