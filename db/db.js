var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('./database.db');

db.run("CREATE TABLE IF NOT EXISTS Users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL, salt TEXT NOT NULL)"); 

module.exports = db;
