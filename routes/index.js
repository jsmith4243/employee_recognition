var express = require('express');
var router = express.Router();

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

/* GET home page. */
router.get('/', function(req, res, next) {

  console.log("xxx");
  
  var url = 'mongodb://localhost:27017/test';

  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server");
    db.close();
    

    
  });

  




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

module.exports = router;
