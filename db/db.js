var sqlite3 = require('sqlite3');
var crypto = require('crypto');

function hashPassword(password, salt) {
  var hash = crypto.createHash('sha256');
  hash.update(password);
  hash.update(salt);
  return hash.digest('hex');
}

var db = new sqlite3.Database('./database.db');

function createTable1() {
    db.exec("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, password TEXT NOT NULL, salt TEXT NOT NULL, is_admin INTEGER, name TEXT, signature BLOB, created INTEGER, CONSTRAINT name_unique UNIQUE (username, is_admin) ON CONFLICT FAIL);", createTable2); 
}
function createTable2() {
    db.exec("CREATE TABLE IF NOT EXISTS classes (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);", createTable3); 
}
function createTable3() {
    db.exec("CREATE TABLE IF NOT EXISTS entries (id INTEGER PRIMARY KEY AUTOINCREMENT, class INTEGER, recipient TEXT, email TEXT, user INTEGER, granted INTEGER, FOREIGN KEY(class) REFERENCES classes(id), FOREIGN KEY(user) REFERENCES users(id))", insertUser1); 
}

function insertUser1() {
    var stmt = db.prepare("INSERT OR IGNORE INTO users(id, username, password, salt, is_admin) VALUES(-1, ?, ?, ?, 0)");
    var salt = crypto.randomBytes(128).toString('base64');
    stmt.run("user@example.com", hashPassword("password", salt), salt);
    stmt.finalize(insertUser2);
}

function insertUser2() {
    var stmt = db.prepare("INSERT OR IGNORE INTO users(id, username, password, salt, is_admin) VALUES(-2, ?, ?, ?, 1)");
    var salt = crypto.randomBytes(128).toString('base64');
    stmt.run("admin@example.com", hashPassword("password", salt), salt);
    stmt.finalize(insertClasses);
}

function insertClasses() {
    var i = 0;
    classes = ["Employee Of The Month", "Employee Of The Week", "Community Builder Of The Month", "Hardest Worker Of The Month", "Most Punctual Employee Of The Month"];
    classes.forEach(function (name) {
        db.run("INSERT OR IGNORE INTO classes (name) VALUES (?)", name, function () {
            i++;
            if (i === classes.length) {
                insertEntries();
            }
        });
    });
}

function insertEntries() {
    entries = [{ id : -1, class : 1, recipient : 'Jane', email : 'jane@example.com', user : -1, granted : 1486113301 },
               { id : -2, class : 2, recipient : 'Bob', email : 'bob@example.com', user : -1, granted : 1486113301 },
               { id : -3, class : 3, recipient : 'Cindy', email : 'cindy@example.com', user : -1, granted : 1486113301 }]
    entries.forEach(function (entry) {
        db.run("INSERT OR IGNORE INTO entries (id, class, recipient, email, user, granted) VALUES (?, ?, ?, ?, ?, ?)",
            entry.id, entry.class, entry.recipient, entry.email, entry.user, entry.granted);
    });
}

createTable1();

module.exports = db;
