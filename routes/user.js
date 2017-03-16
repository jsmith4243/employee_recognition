var crypto = require('crypto');
var db = require('../db/index');
var fs = require('fs');

function hashPassword(password, salt) {
  var hash = crypto.createHash('sha256');
  hash.update(password);
  hash.update(salt);
  return hash.digest('hex');
}

exports.logout = function(req, res) {
  req.logout();
  res.redirect('/');
};

exports.register = function(req, res, next) {
  var username = req.body.username;
  var password = req.body.password;
  var salt = crypto.randomBytes(128).toString('base64');

  var stmt = db.prepare( "INSERT INTO users (username, password, salt, is_admin, created, name, signature, mimetype) VALUES (?, ?, ?, 0, ?, ?, ?, ?)" );
  stmt.run(username, hashPassword(password, salt), salt, Math.floor(Date.now() / 1000), req.body.name, req.file.filename, req.file.mimetype, function(err, row) {
    if (err) {
      res.send("Error registering user" + err);  
    }
    else {
      res.send("User Registered");  
    }
  });
  stmt.finalize(); 
};

exports.mysignature = function(req, res) {
  if (req.user && req.user.is_admin === 0 && req.user.signature) {
    var s = fs.createReadStream('uploads/' + req.user.signature);
    s.on('open', function () {
      res.set('Content-Type', req.user.mimetype);
      s.pipe(res);
    });
    s.on('error', function() {
      res.set('Content-Type', 'text/plain');
      res.status(404).end('Not found');
    });
  }
  else {
    res.redirect('/');
  }
};

