var sqlite3 = require('sqlite3');
var crypto = require('crypto');

function hashPassword(password, salt) {
  var hash = crypto.createHash('sha256');
  hash.update(password);
  hash.update(salt);
  return hash.digest('hex');
}

var db = new sqlite3.Database('./database.db');

db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, password TEXT NOT NULL, salt TEXT NOT NULL, is_admin INTEGER, name TEXT, signature BLOB, created INTEGER, CONSTRAINT name_unique UNIQUE (username, is_admin) ON CONFLICT FAIL)"); 
db.run("CREATE TABLE IF NOT EXISTS classes (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE)"); 
db.run("CREATE TABLE IF NOT EXISTS entries (id INTEGER PRIMARY KEY AUTOINCREMENT, class INTEGER, recipient TEXT, email TEXT, user INTEGER, granted INTEGER, FOREIGN KEY(class) REFERENCES classes(id), FOREIGN KEY(user) REFERENCES users(id))"); 

var stmt = db.prepare("INSERT OR IGNORE INTO users(username, password, salt, is_admin) VALUES(?, ?, ?, 1)");
var salt = crypto.randomBytes(128).toString('base64');

stmt.run("admin@example.com", hashPassword("password", salt), salt);
stmt.finalize();

module.exports = db;
