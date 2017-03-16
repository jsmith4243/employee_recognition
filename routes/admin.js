var crypto = require('crypto');
var db = require('../db/index');

function hashPassword(password, salt) {
  var hash = crypto.createHash('sha256');
  hash.update(password);
  hash.update(salt);
  return hash.digest('hex');
}

exports.reports = function(req, res) {
 if (req.isAuthenticated() && req.user.is_admin === 1) {

    var department = parseInt(req.query['department']);
    var division = parseInt(req.query['division']);
    var params = [];
    var filter = ''
    if (department) {
      filter += ' dp.id = ?';
      params.push(department);
    }
    if (division) {
      if (params.length > 0) {
        filter += ' AND'
      }
      filter += ' dv.id = ?';
      params.push(division);
    }
    if (params.length > 0) {
      filter = ' WHERE' + filter;
    }

    var show = req.query['show'];

    if (show === 'users') {
      var query = 'SELECT u.name AS name, username AS email, dv.name AS division, dp.name AS department, COUNT(e.id) AS count FROM entries e LEFT JOIN classes c ON class = c.id LEFT JOIN users u ON e.user = u.id LEFT JOIN divisions dv ON u.division = dv.id LEFT JOIN departments dp ON u.department = dp.id' + filter + ' GROUP BY u.id';

      db.all('SELECT id, name, id IS ? AS selected FROM departments', department ? department : 0, function(err, departments) {
        db.all('SELECT id, name, id IS ? AS selected FROM divisions', division ? division : 0, function(err, divisions) {
          db.all(query, ...params, function(err, users) {
            if (req.query['submit'] === 'csv') {
              res.setHeader('Content-Disposition', 'attachment; filename=results.csv');
              res.setHeader('Content-Type', 'text/csv');
              res.send(csv.export(users, ['name', 'email', 'division', 'department', 'count'], ['Name', 'Email', 'Division', 'Department', 'Count']));
            }
            else {
              res.render('userstats', { title: 'User Statistics', users: users, departments: departments, divisions: divisions });
            }
          });          
        });
      });
    }
    else {
      var query = 'SELECT u.name AS sender, signature, c.name AS type, class, recipient, email, granted, dv.name AS division, dp.name AS department FROM entries LEFT JOIN classes c ON class = c.id LEFT JOIN users u ON user = u.id LEFT JOIN divisions dv ON u.division = dv.id LEFT JOIN departments dp ON u.department = dp.id' + filter + ' ORDER BY granted DESC';
      db.all('SELECT id, name, id IS ? AS selected FROM departments', department ? department : 0, function(err, departments) {
        db.all('SELECT id, name, id IS ? AS selected FROM divisions', division ? division : 0, function(err, divisions) {
          db.all(query, ...params, function(err, entries) {
            if (req.query['submit'] === 'csv') {
              res.setHeader('Content-Disposition', 'attachment; filename=results.csv');
              res.setHeader('Content-Type', 'text/csv');
              res.send(csv.export(entries, ['sender', 'type', 'recipient', 'email', 'granted', 'division', 'department'], ['Sender', 'Type', 'Recipient', 'Email', 'Granted', 'Division', 'Department']));
            }
            else {
              res.render('allawards', { title: 'All Awards', entries: entries, departments: departments, divisions: divisions });
            }
          });          
        });
      });
    }
  }
  else {
    res.redirect('/');
  }
};

exports.addaward = function(req, res, next) {
  var name = req.body.name;
  var email = req.body.email;
  var awardedby = req.body.awardedby
  var awardtype = 222;
  var date = 223;

  var stmt = db.prepare( "INSERT INTO entries (recipient, email, class, granted) VALUES (?, ?, ?, ?)" );
  stmt.run(name, email, awardtype, date), function(err, row) {
    if (err) {
      res.send("Error registering user" + err);  
    }
    else {
      res.send("Award Added");  
    }
  };
  stmt.finalize(); 
};

exports.deleteaward = function(req, res, next) {
  var awardid = req.body.awardid;
  
  var stmt = db.prepare( "DELETE FROM entries WHERE id = ?" );
  stmt.run(awardid, function(err, row) {
    if (err) {
      res.send("Error deleting user" + err);  
    }
    else {
      console.log("id: " + awardid);
      res.send("Award deleted");  
    }
  });
  stmt.finalize(); 
};

exports.retrieveawardlist = function(req, res, next) {
  var resp = new Array();
  var i = 0;

  db.all("SELECT id, recipient, email, class, granted FROM entries", function(err, rows) {
    rows.forEach(function(row) {
      resp[i] = new Object();
      resp[i].id = row.id;
      resp[i].recipient = row.recipient;
      resp[i].email = row.email;
      resp[i].class = row.class;
      resp[i].granted = row.granted;
      i = i + 1;
    })
    
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(resp));
  });
};

exports.deleteuser = function(req, res, next) {
  var userid = req.body.userid;

  var stmt = db.prepare( "DELETE FROM users WHERE id = ?" );
  stmt.run(userid, function(err, row) {
    if (err) {
      res.send("Error deleting user" + err);  
    }
    else {
      res.send("User deleted");  
    }
  });
  stmt.finalize(); 
};

exports.edituser = function(req, res, next) {
  var userid = req.body.userid;
  var username = req.body.username;
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var name = req.body.name;
  var password = req.body.password;

  var salt = crypto.randomBytes(128).toString('base64');
  var stmt = db.prepare( "UPDATE users SET username = ?, password = ?, salt = ?, name = ? WHERE id = ?" );
  stmt.run(username, hashPassword(password, salt), salt, name, userid, function(err, row) {
    if (err) {
      res.send("Error editing user" + err);
    }
    else {
      res.send("User edited");
    }
  });
  stmt.finalize(); 
};

exports.retrieveuserlist = function(req, res, next) {
  var resp = new Array();
  var i = 0;
  db.all("SELECT id, username, is_admin, name, created FROM users", function(err, rows) {
    rows.forEach(function(row) {
      resp[i] = new Object();
      resp[i].id = row.id;
      resp[i].username = row.username;
      resp[i].name = row.name;
      i = i + 1;
    })

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(resp));
  });
};
