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
    db.exec("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, password TEXT NOT NULL, salt TEXT NOT NULL, is_admin INTEGER, name TEXT, signature TEXT, mimetype TEXT, created INTEGER, division INTEGER, department INTEGER, awardcount INTEGER, FOREIGN KEY(division) REFERENCES divisions(id), FOREIGN KEY(department) REFERENCES departments(id), CONSTRAINT name_unique UNIQUE (username, is_admin) ON CONFLICT FAIL);", createTable2); 
}
function createTable2() {
    db.exec("CREATE TABLE IF NOT EXISTS classes (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);", createTable3); 
}
function createTable3() {
    db.exec("CREATE TABLE IF NOT EXISTS entries (id INTEGER PRIMARY KEY AUTOINCREMENT, class INTEGER, recipient TEXT, email TEXT, user INTEGER, granted INTEGER, FOREIGN KEY(class) REFERENCES classes(id), FOREIGN KEY(user) REFERENCES users(id))", createTable4); 
}
function createTable4() {
    db.exec("CREATE TABLE IF NOT EXISTS divisions (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)", createTable5); 
}
function createTable5() {
    db.exec("CREATE TABLE IF NOT EXISTS departments (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)", insertDivisions); 
}

function insertDivisions() {
    var i = 0;
    divisions = [ {id: 1, name: "West"},
                  {id: 2, name: "North"},
                  {id: 3, name: "South"},
                  {id: 4, name: "East"}];
    divisions.forEach(function (division) {
        db.run("INSERT OR IGNORE INTO divisions (id, name) VALUES (?, ?)", division.id, division.name, function () {
            i++;
            if (i === divisions.length) {
                insertDepartments();
            }
        });
    });
}

function insertDepartments() {
    var i = 0;
    departments = [ {id: 1, name: "Marketing"},
                  {id: 2, name: "Accounting"},
                  {id: 3, name: "Human Resources"},
                  {id: 4, name: "IT"}];
    departments.forEach(function (department) {
        db.run("INSERT OR IGNORE INTO departments (id, name) VALUES (?, ?)", department.id, department.name, function () {
            i++;
            if (i === departments.length) {
                insertUser1();
            }
        });
    });
}


function insertUser1() {
    var stmt = db.prepare("INSERT OR IGNORE INTO users(id, username, password, salt, is_admin, name, signature, mimetype) VALUES(-1, ?, ?, ?, 0, ?, ?, ?)");
    var salt = crypto.randomBytes(128).toString('base64');
    stmt.run("user@example.com", hashPassword("password", salt), salt, "Example User", "placeholder2.png", "image/png");
    stmt.finalize(insertUser2);
}

function insertUser2() {
    var stmt = db.prepare("INSERT OR IGNORE INTO users(id, username, password, salt, is_admin) VALUES(-2, ?, ?, ?, 1)");
    var salt = crypto.randomBytes(128).toString('base64');
    stmt.run("admin@example.com", hashPassword("password", salt), salt);
    stmt.finalize(insertUsers);
}

function insertUsers() {
    var i = 0;
    users = [ {id: 1, username: "a@example.com", name: "Andy Atkinson", division: 1, department: 1, awardcount : 4},
              {id: 2, username: "b@example.com", name: "Beatrix Bancroft", division: 1, department: 1, awardcount : 1},
              {id: 3, username: "c@example.com", name: "Carol Campbell", division: 1, department: 2, awardcount : 7},
              {id: 4, username: "d@example.com", name: "Diana Durant", division: 1, department: 2, awardcount : 0},
              {id: 5, username: "e@example.com", name: "Eugene Eberly", division: 1, department: 3, awardcount : 0},
              {id: 6, username: "f@example.com", name: "Fred Fuchs", division: 1, department: 3, awardcount : 0},
              {id: 7, username: "g@example.com", name: "Ginny Guo", division: 1, department: 4, awardcount : 0},
              {id: 8, username: "h@example.com", name: "Harold Hearst", division: 2, department: 1, awardcount : 0},
              {id: 9, username: "i@example.com", name: "Irene Kerr", division: 2, department: 2, awardcount : 0},
              {id: 10, username: "j@example.com", name: "Joanna Jiang", division: 2, department: 3, awardcount : 0},
              {id: 11, username: "k@example.com", name: "Kathleen Kerr", division: 2, department: 4, awardcount : 0},
              {id: 12, username: "l@example.com", name: "Lee LeConte", division: 2, department: 4, awardcount : 0},
              {id: 13, username: "m@example.com", name: "Michael Moss", division: 2, department: 4, awardcount : 0},
              {id: 14, username: "n@example.com", name: "Nancy Nunez", division: 2, department: 4, awardcount : 0},
              {id: 15, username: "o@example.com", name: "Oscar O'Brien", division: 3, department: 1, awardcount : 0},
              {id: 16, username: "p@example.com", name: "Pamela Peek", division: 3, department: 1, awardcount : 0},
              {id: 17, username: "q@example.com", name: "Quincy Qiu", division: 3, department: 1, awardcount : 0},
              {id: 18, username: "r@example.com", name: "Renee Roth", division: 3, department: 2, awardcount : 0},
              {id: 19, username: "s@example.com", name: "Steven Simon", division: 3, department: 2, awardcount : 0},
              {id: 20, username: "t@example.com", name: "Tasha Tang", division: 3, department: 3, awardcount : 0},
              {id: 21, username: "u@example.com", name: "Ursula Ure", division: 3, department: 3, awardcount : 0},
              {id: 22, username: "v@example.com", name: "Vincent Vo", division: 3, department: 4, awardcount : 0},
              {id: 23, username: "w@example.com", name: "Will Watt", division: 4, department: 1, awardcount : 0},
              {id: 24, username: "x@example.com", name: "Xavier Xi", division: 4, department: 2, awardcount : 0},
              {id: 25, username: "y@example.com", name: "Yvette Yang", division: 4, department: 3, awardcount : 0},
              {id: 26, username: "z@example.com", name: "Zelda Zhou", division: 4, department: 4, awardcount : 0}
    ];
    users.forEach(function (user) {
        db.run("INSERT OR IGNORE INTO users(id, username, name, division, department, awardcount, password, salt, signature, mimetype) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            user.id, user.username, user.name, user.division, user.department, user.awardcount, "", "", "placeholder2.png", "image/png", function () {
            i++;
            if (i === users.length) {
                insertClasses();
            }
        });
    });
}

function insertClasses() {
    var i = 0;
    classes = ["Employee Of The Month", "Employee Of The Week", "Community Builder Of The Month", "Hardest Worker Of The Month", "Most Punctual Employee Of The Month"];
    classes.forEach(function (name) {
        db.run("INSERT OR IGNORE INTO classes (name) VALUES (?)", name, function () {
            i++;
            if (i === classes.length) {
                insertEntries1();
            }
        });
    });
}

function insertEntries1() {
    var i = 0;
    entries = [{ id : -1, class : 1, recipient : 'Jane', email : 'jane@example.com', user : -1, granted : 1486113301 },
               { id : -2, class : 2, recipient : 'Bob', email : 'bob@example.com', user : -1, granted : 1486113301 },
               { id : -3, class : 3, recipient : 'Cindy', email : 'cindy@example.com', user : -1, granted : 1486113301 }]
    entries.forEach(function (entry) {
        db.run("INSERT OR IGNORE INTO entries (id, class, recipient, email, user, granted) VALUES (?, ?, ?, ?, ?, ?)",
            entry.id, entry.class, entry.recipient, entry.email, entry.user, entry.granted, function () {
            i++;
            if (i === entries.length) {
                insertEntries2();
            }
        });
    });
}

function insertEntries2() {
    entries = [{ id : 1 , class : 1, user : 1,  granted : 1458009057, email : '902@example.com', recipient : 'Abel' },
               { id : 2 , class : 2, user : 2,  granted : 1459989887, email : '937@example.com', recipient : 'Baker' },
               { id : 3 , class : 3, user : 3,  granted : 1429057927, email : '254@example.com', recipient : 'Condi' },
               { id : 4 , class : 4, user : 4,  granted : 1485517561, email : '852@example.com', recipient : 'Dana' },
               { id : 5 , class : 5, user : 5,  granted : 1434358163, email : '905@example.com', recipient : 'Ethel' },
               { id : 6 , class : 1, user : 6,  granted : 1451517690, email : '988@example.com', recipient : 'Gary' },
               { id : 7 , class : 2, user : 7,  granted : 1404497986, email : '792@example.com', recipient : 'Hannah' },
               { id : 8 , class : 3, user : 8,  granted : 1492503263, email : '756@example.com', recipient : 'Ivan' },
               { id : 9 , class : 4, user : 9,  granted : 1499063017, email : '816@example.com', recipient : 'Joshua' },
               { id : 10, class : 5, user : 10, granted : 1449406295, email : '769@example.com', recipient : 'Kay' },
               { id : 11, class : 1, user : 11, granted : 1479285724, email : '798@example.com', recipient : 'Larry' },
               { id : 12, class : 2, user : 12, granted : 1419152647, email : '326@example.com', recipient : 'Mandy' },
               { id : 13, class : 3, user : 13, granted : 1495328518, email : '301@example.com', recipient : 'Nick' },
               { id : 14, class : 4, user : 14, granted : 1491471378, email : '629@example.com', recipient : 'Ophelia' },
               { id : 15, class : 5, user : 15, granted : 1486258341, email : '572@example.com', recipient : 'Pat' },
               { id : 16, class : 1, user : 16, granted : 1492538418, email : '264@example.com', recipient : 'Quigly' },
               { id : 17, class : 2, user : 17, granted : 1422346105, email : '851@example.com', recipient : 'Ruth' },
               { id : 18, class : 3, user : 18, granted : 1467332971, email : '137@example.com', recipient : 'Sean' },
               { id : 19, class : 4, user : 19, granted : 1423324268, email : '834@example.com', recipient : 'Tom' },
               { id : 20, class : 5, user : 20, granted : 1484736684, email : '841@example.com', recipient : 'Umar' },
               { id : 21, class : 1, user : 21, granted : 1432166031, email : '610@example.com', recipient : 'Vanna' },
               { id : 22, class : 2, user : 22, granted : 1474082301, email : '297@example.com', recipient : 'Wesley' },
               { id : 23, class : 3, user : 23, granted : 1483525916, email : '426@example.com', recipient : 'Xander' },
               { id : 24, class : 4, user : 24, granted : 1477207573, email : '668@example.com', recipient : 'Yvonne' },
               { id : 25, class : 5, user : 25, granted : 1426207320, email : '603@example.com', recipient : 'Zoe' },
               { id : 26, class : 1, user : 26, granted : 1497288004, email : '230@example.com', recipient : 'Amos' },
               { id : 27, class : 2, user : 1,  granted : 1456530995, email : '591@example.com', recipient : 'Bert' },
               { id : 28, class : 3, user : 2,  granted : 1446761909, email : '757@example.com', recipient : 'Courtney' },
               { id : 29, class : 4, user : 3,  granted : 1406836552, email : '732@example.com', recipient : 'Donald' },
               { id : 30, class : 5, user : 4,  granted : 1456247433, email : '800@example.com', recipient : 'Edith' },
               { id : 31, class : 1, user : 5,  granted : 1446792152, email : '230@example.com', recipient : 'Fatima' },
               { id : 32, class : 2, user : 6,  granted : 1416811446, email : '591@example.com', recipient : 'Gertrude' },
               { id : 33, class : 3, user : 7,  granted : 1466207251, email : '757@example.com', recipient : 'Holly' },
               { id : 34, class : 4, user : 8,  granted : 1476841900, email : '732@example.com', recipient : 'Ida' },
               { id : 35, class : 5, user : 9,  granted : 1496684942, email : '800@example.com', recipient : 'Jim' },
               { id : 36, class : 1, user : 10, granted : 1467619283, email : '230@example.com', recipient : 'Khaled' },
               { id : 37, class : 2, user : 11, granted : 1428029153, email : '591@example.com', recipient : 'Linda' },
               { id : 38, class : 3, user : 12, granted : 1408775327, email : '757@example.com', recipient : 'Mitch' },
               { id : 39, class : 4, user : 13, granted : 1439591470, email : '732@example.com', recipient : 'Ned' },
               { id : 40, class : 5, user : 14, granted : 1409326251, email : '800@example.com', recipient : 'Olga' },
               { id : 41, class : 3, user : 15, granted : 1406492532, email : '998@example.com', recipient : 'Phineas' }
            ]
    entries.forEach(function (entry) {
        db.run("INSERT OR IGNORE INTO entries (id, class, recipient, email, user, granted) VALUES (?, ?, ?, ?, ?, ?)",
            entry.id, entry.class, entry.recipient, entry.email, entry.user, entry.granted);
    });
}

createTable1();

module.exports = db;
