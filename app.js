var express = require('express');
var session = require('express-session');
var crypto = require('crypto');
var sqlite3 = require('sqlite3');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var db = require('./db/index');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();


// passport setup

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

// function createSalt() {
//   return crypto.randomBytes(128).toString('base64');
// }

function hashPassword(password, salt) {
  var hash = crypto.createHash('sha256');
  hash.update(password);
  hash.update(salt);
  return hash.digest('hex');
}

passport.use(new LocalStrategy(
  function(username, password, done) {
    db.get('SELECT salt FROM users WHERE username = ?', username, function(err, row) {
      if (!row) return done(null, false);
      console.log("salt: " + row.salt);
      var hash = hashPassword(password, row.salt);
      console.log("hash: " + hash);
      db.get('SELECT username, id FROM users WHERE username = ? AND password = ?', username, hash, function(err, row) {
        if (!row) return done(null, false);
        return done(null, row);
      });
    });
  }));

passport.serializeUser(function(user, done) {
  return done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  db.get('SELECT id, username FROM users WHERE id = ?', id, function(err, row) {
    if (!row) return done(null, false);
    return done(null, row);
  });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({secret: '12345', resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.set('views', path.join(__dirname, 'views'));
var cons = require('consolidate');
app.engine('hbs', cons.handlebars);
app.set('view engine', 'hbs');

//nodemon
app.set('port', process.env.PORT || 3000);
var server = app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + server.address().port);
});


module.exports = app;
