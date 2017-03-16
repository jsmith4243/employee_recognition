var db = require('../db/index');

exports.index = function(req, res, next) {
  if (req.user) {
    if (req.user.is_admin === 1) {
      res.redirect('/administration');
    }
    else {
      db.all('SELECT * FROM classes', function(err, classes) {
        db.all('SELECT * FROM entries LEFT JOIN classes c ON class = c.id WHERE user = ?', req.user.id, function(err, entries) {
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
  res.render('userRegistration', { title: 'User Registration' });
};

exports.administration = function(req, res, next) {
  if (req.isAuthenticated() && req.user.is_admin === 1) {
    next();
  }
  else {
    res.render('adminLogin', { title: 'Administration Login' });
  }
} , function(req, res) {
  res.render('administration', { title: 'Administration' });
};
