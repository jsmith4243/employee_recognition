var crypto = require('crypto');
var csv = require('../csv/index');
var db = require('../db/index');

function hashPassword(password, salt) {
  var hash = crypto.createHash('sha256');
  hash.update(password);
  hash.update(salt);
  return hash.digest('hex');
}

exports.createuser = function(req, res) {
  db.all('SELECT id, name FROM departments', function(err, departments) {
    db.all('SELECT id, name FROM divisions', function(err, divisions) {
      res.render('createuser', { title: 'Create User', username: req.user.username, name: req.user.name, signature: req.user.signature, divisions: divisions, departments: departments });
    });
  });
}

exports.createadmin = function(req, res) {
  res.render('createadmin', { title: 'Create Admin'});
}

exports.createadminpost = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var salt = crypto.randomBytes(128).toString('base64');
  var stmt = db.prepare( "INSERT INTO users (username, password, salt, is_admin) VALUES (?, ?, ?, 1)" );
  stmt.run(username, hashPassword(password, salt), salt, function(err, row) {
    if (err) {
      res.render('message', { title: 'Error', text: 'Error registering admin: ' + err, next: '/administration' });  
    }
    else {
        res.render('message', { title: 'Admin Created', text: 'Admin created.', next: '/administration?show=admins' });  
    }
  });

}

exports.reports = function(req, res) {
  if (req.isAuthenticated() && req.user.is_admin === 1) {
    var show = req.query['show'];

    if (show === 'admins') {
      db.all('SELECT id, username, name, id = ? AS me FROM users WHERE is_admin = 1', req.user.id, function(err, admins) {
        res.render('manageadmins', { title: 'Administration', admins: admins });
      });
    }
    else {
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


      if (show === 'users') {
        var query = 'WITH x AS (SELECT u.name AS name, u.id AS id, username AS email, dv.name AS division, dp.name AS department, COUNT(e.id) AS count FROM entries e LEFT JOIN users u ON e.user = u.id LEFT JOIN divisions dv ON u.division = dv.id LEFT JOIN departments dp ON u.department = dp.id WHERE is_admin = 0 GROUP BY u.id ), y AS (SELECT u.name AS name, u.id AS id, username AS email, dv.name AS division, dp.name AS department, 0 AS count FROM users u LEFT JOIN divisions dv ON u.division = dv.id LEFT JOIN departments dp ON u.department = dp.id WHERE is_admin = 0 AND u.id NOT IN (SELECT id FROM x)) SELECT * FROM x UNION ALL SELECT * FROM y' + filter + ' ORDER BY id';

        db.all('SELECT id, name, id IS ? AS selected FROM departments', department ? department : 0, function(err, departments) {
          db.all('SELECT id, name, id IS ? AS selected FROM divisions', division ? division : 0, function(err, divisions) {
            db.all(query, ...params, function(err, users) {
              if (req.query['submit'] === 'csv') {
                res.setHeader('Content-Disposition', 'attachment; filename=results.csv');
                res.setHeader('Content-Type', 'text/csv');
                res.send(csv.export(users, ['name', 'email', 'division', 'department', 'count'], ['Name', 'Email', 'Division', 'Department', 'Count']));
              }
              else {
                res.render('manageusers', { title: 'Administration', users: users, departments: departments, divisions: divisions });
              }
            });          
          });
        });
      }
      else {
        var query = 'SELECT u.name AS sender, entries.id AS id, signature, c.name AS type, class, recipient, email, granted, dv.name AS division, dp.name AS department FROM entries LEFT JOIN classes c ON class = c.id LEFT JOIN users u ON user = u.id LEFT JOIN divisions dv ON u.division = dv.id LEFT JOIN departments dp ON u.department = dp.id' + filter + ' ORDER BY granted DESC';
        db.all('SELECT id, name, id IS ? AS selected FROM departments', department ? department : 0, function(err, departments) {
          db.all('SELECT id, name, id IS ? AS selected FROM divisions', division ? division : 0, function(err, divisions) {
            db.all(query, ...params, function(err, entries) {
              if (req.query['submit'] === 'csv') {
                res.setHeader('Content-Disposition', 'attachment; filename=results.csv');
                res.setHeader('Content-Type', 'text/csv');
                res.send(csv.export(entries, ['sender', 'type', 'recipient', 'email', 'granted', 'division', 'department'], ['Sender', 'Type', 'Recipient', 'Email', 'Granted', 'Division', 'Department']));
              }
              else {
                var chartoptions = [ {id: 0, name: ''}, {id: 1, name: 'User', groupby: 'sender'}, {id: 2, name: 'Department', groupby: 'department'}, {id: 3, name: 'Division', groupby: 'division'} ];
                var selectedchart = parseInt(req.query['chart']);
                if (selectedchart >= 1 && selectedchart <= 3) {
                  chartoptions[selectedchart].selected = true;
                  var chartquery = 'SELECT u.name AS sender, count(entries.id) AS count, c.name AS type, dv.name AS division, dp.name AS department FROM entries LEFT JOIN classes c ON class = c.id LEFT JOIN users u ON user = u.id LEFT JOIN divisions dv ON u.division = dv.id LEFT JOIN departments dp ON u.department = dp.id' + filter + ' GROUP BY ' + chartoptions[selectedchart].groupby;
                  db.all(chartquery, ...params, function(err, counts) {
                    var formattedcounts = counts.map(function (row) {
                      return { category: row[chartoptions[selectedchart].groupby], count: row.count };
                    });
                    var chartjson = JSON.stringify({ title: 'Awards sent by ' + chartoptions[selectedchart].name, label: chartoptions[selectedchart].name, data: formattedcounts });
                    res.render('allawards', { title: 'Administration', entries: entries, departments: departments, divisions: divisions, chartoptions: chartoptions, chartjson: chartjson });
                  });
                }
                else {
                  res.render('allawards', { title: 'Administration', entries: entries, departments: departments, divisions: divisions, chartoptions: chartoptions, chartjson: '' });
                }
              }
            });          
          });
        });
      }
    }
  }
  else {
    res.redirect('/');
  }
};

exports.deleteaward = function(req, res, next) {
  if (req.isAuthenticated()) {
    var id = req.body.id;
    var query;
    var params = [id];

    if (req.user.is_admin === 1) {
      query = "DELETE FROM entries WHERE id = ?";
    }
    else {
      query = "DELETE FROM entries WHERE id = ? AND user = ?";
      params.push(req.user.id);
    }
    var stmt = db.prepare(query);
    stmt.run(...params, function(err, row) {
      if (err) {
        res.render('message', { title: 'Error', text: 'Error deleting award: ' + err, next: '/' });  
      }
      else {
        res.render('message', { title: 'Award deleted', text: 'Award deleted.', next: '/' });  
      }
    });
  }
  else {
    res.redirect('/');
  }
};

exports.deleteuser = function(req, res, next) {
  var userid = req.body.userid;

  var delEntries = db.prepare('DELETE FROM entries WHERE user = ?');
  delEntries.run(userid, function(err, row) {
    if (err) {
      res.render('message', { title: 'Error', text: 'Error deleting user: ' + err, next: '/administration?show=users' });  
    }
    else {
      var delUser = db.prepare( "DELETE FROM users WHERE id = ?" );
      delUser.run(userid, function(err, row) {
        if (err) {
          res.render('message', { title: 'Error', text: 'Error deleting user: ' + err, next: '/administration?show=users' });  
        }
        else {
          res.render('message', { title: 'User deleted', text: 'User deleted.', next: '/administration?show=users' });  
        }
      });
    }
  });
};

exports.deleteadmin = function(req, res, next) {
  var userid = req.body.userid;

  if (userid == req.user.id) {
    res.render('message', { title: 'Error', text: 'Cannot delete own account.', next: '/administration?show=admins' });  
  }
  else {
    var delUser = db.prepare( "DELETE FROM users WHERE id = ?" );
    delUser.run(userid, function(err, row) {
      if (err) {
        res.render('message', { title: 'Error', text: 'Error deleting admin: ' + err, next: '/administration?show=admins' });  
      }
      else {
        res.render('message', { title: 'Admin deleted', text: 'Admin deleted.', next: '/administration?show=admins' });  
      }
    });
  }
};

exports.edituserget = function(req, res) {
  var id = req.query.id;

  db.get('SELECT id, username, name, signature, mimetype, division, department FROM users WHERE id = ?', id, function(err, row) {
    if (!row) {
      // error
    }
    else {
      db.all('SELECT id, name, id IS ? AS selected FROM departments', row.department ? row.department : 0, function(err, departments) {
        db.all('SELECT id, name, id IS ? AS selected FROM divisions', row.division ? row.division : 0, function(err, divisions) {
          res.render('edituser', { title: 'Edit User', username: row.username, name: row.name, signature: row.signature, mimetype: row.mimetype, divisions: divisions, departments: departments });
        });
      });
    }
  });

}

exports.edituser = function(req, res, next) {
  var id = req.user.id;
  var name = req.body.name;
  var division = req.body.division;
  var department = req.body.department;
  var password = req.body.password;

  if (req.file) {
    var updateSignature = db.prepare('UPDATE users SET signature = ?, mimetype = ? WHERE id = ?');
    updateSignature.run(req.file.filename, req.file.mimetype, id);
  }

  var updateInfo = db.prepare('UPDATE users SET name = ?, division = ?, department = ? WHERE id = ?');
  updateInfo.run(name, division, department, id, function(err, row) {

    if (password != null && password.length > 0) {
      var salt = crypto.randomBytes(128).toString('base64');
      stmt = db.prepare('UPDATE users SET password = ?, salt = ? WHERE id = ?');
      stmt.run(hashPassword(password, salt), salt, id, function(err, row) {
        res.render('message', { title: 'User Edited', text: 'User edited.', next: '/administration?show=users' });  
      });
    }
    else {
      res.render('message', { title: 'User Edited', text: 'User edited.', next: '/administration?show=users' });  
    }
  });
};
