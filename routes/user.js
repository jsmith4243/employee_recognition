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

exports.edituserFromSettings = function(req, res, next) {
  var userid = req.user.id;
  var username = req.body.username;
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var name = req.body.name;
  var password = req.body.password;
  var salt = crypto.randomBytes(128).toString('base64');
  var passwordhash = hashPassword(password, salt);

  var stmt = db.prepare( "UPDATE users SET username = ?, name = ?, password = ?, salt = ? WHERE id = ?" );
  stmt.run(username, name, passwordhash, salt, userid, function(err, row) {
    if (err) {
      res.send("Error editing user" + err);  
    }
    else {
      console.log("id: " + userid);
      res.send("User edited");
    }
  });
  stmt.finalize(); 
};

exports.retrieveuserlistFromSettings = function(req, res, next) {
  var resp = new Array();
  var i = 0;
  var idofcurrentuser;
  var idofcurrentuser = req.user.id;

  db.all("SELECT id, username, is_admin, name, created, password FROM users WHERE id = " + idofcurrentuser , function(err, rows) {
    rows.forEach(function(row) {
      resp[i] = new Object();
      resp[i].id = row.id;
      resp[i].username = row.username;
      resp[i].password = row.password;
      resp[i].name = row.name;
      i = i + 1;
    })
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(resp));
  });
};
