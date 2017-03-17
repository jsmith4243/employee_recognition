var crypto = require('crypto');
var db = require('../db/index');
var fs = require('fs');
var nodemailer = require('nodemailer');

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

exports.passwordresetget = function(req, res) {
  var email = req.query['email'];
  var is_admin = req.query['is_admin'];
  var id = req.query['id'];
  if (typeof email === 'undefined' || typeof is_admin === 'undefined' || typeof id === 'undefined') {
    if (is_admin !== '1') {
      is_admin = '0';
    }
    res.render('resetrequest', { title: 'Reset Password', is_admin : is_admin });
  }
  else {
    db.get('SELECT id, salt, resethash, resetdate FROM users WHERE username = ? AND is_admin = ?', email, is_admin, function(err, user) {
      if (err) {
        res.send("Database error, please try again later.");  
      }
      else if (typeof user === 'undefined') {
        res.send("Invalid or expired password reset link.");  
      }
      else {
        var timeDiff = Math.floor(Date.now()) - user['resetdate'];
        if (user['resetdate'] === null || timeDiff > 1000*60*60*24) {
          res.send("Invalid or expired password reset link.");  
        }
        else {
          var hash = hashPassword(id, user['salt']);
          if (hash === user['resethash']) {
            res.render('resetpassword', { title: 'Reset Password', username: email, is_admin: is_admin, id: id });
          }
          else {
            res.send("Invalid or expired password reset link.");  
          }
        }
      }
    });
  }
};

exports.passwordresetpost = function(req, res, next) {
  var username = req.body.username;
  var is_admin = req.body.is_admin;
  var action = req.body.action;

  db.get('SELECT id, salt, resethash, resetdate FROM users WHERE username = ? AND is_admin = ?', username, is_admin, function(err, user) {
    if (typeof user === 'undefined') {
      if (action == 'request') {
        res.send("An email containing a password reset link has been sent to the submitted email address if it matched a user in our records.");  
      }
      else {
        res.send("Invalid or expired password reset link.");  
      }
    }
    else {
      switch (action) {
        case 'request':
          var id = crypto.randomBytes(128).toString('base64').replace('+', '-').replace('/', '_');
          var stmt = db.prepare("UPDATE users SET resethash = ?, resetdate = ? WHERE id = ?");
          stmt.run(hashPassword(id, user['salt']), Math.floor(Date.now()), user['id'], function(err, row) {
            var link = 'http://localhost:3000/resetpassword?email=' + encodeURIComponent(username) + '&is_admin=' + is_admin + '&id=' + encodeURIComponent(id);
            var transporter = nodemailer.createTransport('smtps://recognitionprog%40gmail.com:pa1234ss@smtp.gmail.com');
            var mailOptions = {
              from: '"Gemini Company Awards" <recognitionprog@gmail.com>',
              to: req.body.username,
              subject: 'Password reset request',
              html: '<p>A password reset request was requested for your account. You may reset your password by following this link: <a href="' + link +  '">' + link + '</a></p><p>If you did not request this, you may ignore this email.</p>'
            };
            transporter.sendMail(mailOptions);
            res.send("An email containing a password reset link has been sent to the submitted email address if it matched a user in our records.");  
          });
          break;          
        case 'reset':
          timeDiff = Math.floor(Date.now()) - user['resetdate'];
          if (user['resetdate'] === null || timeDiff > 1000*60*60*24) {
            res.send("Invalid or expired password reset link.");  
          }
          else {
            var hash = hashPassword(req.body.id, user['salt']);
            if (hash === user['resethash']) {
              var password = req.body.password;
              var salt = crypto.randomBytes(128).toString('base64');
              stmt = db.prepare('UPDATE users SET password = ?, salt = ?, resethash = NULL, resetdate = NULL WHERE id = ?');
              stmt.run(hashPassword(password, salt), salt, user['id'], function(err, row) {
                res.send("Password reset.");  
              });
            }
          }
          break;
        default:
          res.send("Invalid or expired password reset link.");  
          break;
      }
    }
  });
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
