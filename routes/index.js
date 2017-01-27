var express = require('express');
var router = express.Router();
var crypto = require('crypto');



/* //mongo
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
*/


var passport = require('passport');
var sqlite3 = require('sqlite3').verbose();
var db = require('../db/index');

function hashPassword(password, salt) {
  var hash = crypto.createHash('sha256');
  hash.update(password);
  hash.update(salt);
  return hash.digest('hex');
}



/* GET home page. */
router.get('/', function(req, res, next) {


  var id = req.params.id; //for get
  
  console.log("req.params.operation : " + req.params.id);
  console.log("req.param('operation'): " + req.param('id'));
  console.log("req.body.id: " + req.body.id);
  
  console.log("id is: " + id);




  res.render('index', { title: 'Expressxxx' });
  
  
  
});

router.get('/userRegistration', function(req, res, next) {
  res.render('userRegistration', { title: 'User Registration' });
});

router.get('/administration', function(req, res, next) {
  res.render('administration', { title: 'Administration' });
});

router.get('/awardDisplay', function(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  }
  else {
    res.send("Not authenticated");
  }
} , function(req, res) {
  res.render('awardDisplay', { title: 'awardDisplay' });
});

router.post('/login', passport.authenticate('local', { successRedirect: '/awardDisplay' }));

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
})

router.post('/register', function(req, res, next) {

  // var id = req.body.id; //for post 
  //id = null; 
  
  var username = req.body.username;
  var password = req.body.password;
  var salt = crypto.randomBytes(128).toString('base64');
  
  var stmt = db.prepare( "INSERT INTO Users (username, password, salt) VALUES (?, ?, ?)" );
  stmt.run(username, hashPassword(password, salt), salt, function(err, row) {
    if (err) {
      res.send("Error registering user" + err);  
    }
    else {
    console.log("username: " + username);
    console.log("salt: " + salt);
    console.log("hash: " + password);
    
    res.send("User Registered");  
    }
  });
  stmt.finalize(); 


});

module.exports = router;
