var express = require('express');
var router = express.Router();




/* //mongo
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
*/



var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('database.db');


/* GET home page. */
router.get('/', function(req, res, next) {

  /* //mongo
  var url = 'mongodb://localhost:27017/test';
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server");
    db.close();
  
    

    
  });
  */
  
  
 

  var id = req.params.id; //for get
  
  console.log("req.params.operation: " + req.params.id);
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
  res.render('awardDisplay', { title: 'awardDisplay' });
});

router.post('/register', function(req, res, next) {

  //db.run("INSERT INTO USERS(ID, USERNAME, PASSWORD) VALUES('2', 'user2', 'pass')");
  
  var id = req.body.id; //for post

  
  console.log("id is: " + id);
  
  res.send("User Registered");	

});

module.exports = router;
