var crypto = require('crypto');
var db = require('../db/index');

function hashPassword(password, salt) {
  var hash = crypto.createHash('sha256');
  hash.update(password);
  hash.update(salt);
  return hash.digest('hex');
}

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
