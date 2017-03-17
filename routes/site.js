var db = require('../db/index');

exports.index = function(req, res, next) {
  if (req.user) {
    if (req.user.is_admin === 1) {
      res.redirect('/administration');
    }
    else {
      db.all('SELECT * FROM classes', function(err, classes) {
        db.all('SELECT e.id AS id, e.class AS class, c.name AS name, e.recipient AS recipient, e.email AS email, e.user AS user, e.granted AS granted FROM entries e LEFT JOIN classes c ON class = c.id WHERE user = ?', req.user.id, function(err, entries) {
          res.render('awardDisplay', { title: 'Awards', user: req.user.name, classes: classes, entries: entries });
        });
      });
    }
  }
  else {
    res.render('index', { title: 'Employee Recognition' });
  }
};

exports.registration = function(req, res, next) {
  db.all('SELECT id, name, id FROM departments', function(err, departments) {
    db.all('SELECT id, name, id FROM divisions', function(err, divisions) {
      res.render('userRegistration', { title: 'User Registration', departments: departments, divisions: divisions });
    });
  });
};

exports.administration = function(req, res) {
  db.all('SELECT id, username, name FROM users WHERE is_admin = 0', function(err, users) {
    db.all('SELECT id, username, name FROM users WHERE is_admin = 1', function(err, admins) {
      res.render('administration', { title: 'Administration', users: users, admins: admins });
    });
  });
};

exports.userSettings = function(req, res) {
  db.all('SELECT id, name, id IS ? AS selected FROM departments', req.user.department ? req.user.department : 0, function(err, departments) {
    db.all('SELECT id, name, id IS ? AS selected FROM divisions', req.user.division ? req.user.division : 0, function(err, divisions) {
      res.render('settings', { title: 'Settings', username: req.user.username, name: req.user.name, signature: req.user.signature, divisions: divisions, departments: departments });
    });
  });
};
