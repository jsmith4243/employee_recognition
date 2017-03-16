var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var csv = require('../csv/index');
var fs = require('fs');
var multer = require('multer');
var mime = require('mime');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    crypto.pseudoRandomBytes(16, function (err, raw) {
        cb(err, err ? undefined : raw.toString('hex') + '.' + mime.extension(file.mimetype))
    });
  }
})

var upload = multer({ dest: 'uploads/', storage: storage});

/* //mongo
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
*/

var nodemailer = require('nodemailer');



var passport = require('passport');
var sqlite3 = require('sqlite3').verbose();
var db = require('../db/index');

function hashPassword(password, salt) {
  var hash = crypto.createHash('sha256');
  hash.update(password);
  hash.update(salt);
  return hash.digest('hex');
}

var award = require('./award');
var site = require('./site');
var user = require('./user');
var admin = require('./admin');

router.get('/', site.index);

router.get('/userRegistration', site.registration);

router.get('/administration', site.administration);

router.get('/chart', function(req, res, next) {

  var data = '[{"username": "user1", "numberofawards": "3"}, {"username": "user2", "numberofawards": "5"} ]';

  var javascriptobject = JSON.parse(data);

  var jsonstring = JSON.stringify(data);

  //console.log("Username: " + data[0].username); //wrong if data is an string
  //console.log("Username: " + javascriptobject[0].username);

  //console.log("Username: " + jsonstring[0].username);

  res.render('Chart', { title: 'Chart', json: data });
  //res.render('chart', { title: 'chart', json: javascriptobject });
  //res.render('chart', { title: 'chart', json: jsonstring });

});

router.post('/getuserawardcount', function(req, res, next) {


  console.log("/getuserawardcount received");

  var resp = new Array();
  
  var i = 0;
  
  

  /*    //extra field awardcount in users table implementation
  db.all("SELECT id, username, awardcount FROM users", function(err, rows) {
    rows.forEach(function(row) {
      //console.log(row.id, row.username);
      resp[i] = new Object();
      resp[i].id = row.id;
      resp[i].username = row.username;
      resp[i].awardcount = row.awardcount;
      
      
      i = i + 1;
      
      
    })
    
    
    console.log("i: " + i);
    console.log("resp[0].username:" + resp[1].username);
    console.log(JSON.stringify(resp));
    



    //db.all('SELECT count(*) FROM entries WHERE user =  ', function(err, users) {


  });

  */


  db.all("SELECT user, users.username, count(user) AS count FROM entries LEFT OUTER JOIN users ON entries.user = users.id  GROUP BY user", function(err, rows) {
    rows.forEach(function(row) {
      //console.log(row.id, row.username);
      resp[i] = new Object();
      resp[i].id = row.user;
      resp[i].username = row.username;
      resp[i].awardcount = row.count;
      
      
      i = i + 1;
      
      
    })


  


    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(resp));

  });

  



 




});




router.post('/getemployeeawardcount', function(req, res, next) {


  console.log("/getemployeeawardcount received");

  var resp = new Array();
  
  var i = 0;
  
  

  /*    //extra field awardcount in users table implementation
  db.all("SELECT id, username, awardcount FROM users", function(err, rows) {
    rows.forEach(function(row) {
      //console.log(row.id, row.username);
      resp[i] = new Object();
      resp[i].id = row.id;
      resp[i].username = row.username;
      resp[i].awardcount = row.awardcount;
      
      
      i = i + 1;
      
      
    })
    
    
    console.log("i: " + i);
    console.log("resp[0].username:" + resp[1].username);
    console.log(JSON.stringify(resp));
    



    //db.all('SELECT count(*) FROM entries WHERE user =  ', function(err, users) {


  });

  */


  db.all("SELECT user, recipient, email, count(email) AS count FROM entries LEFT OUTER JOIN users ON entries.user = users.id  GROUP BY recipient", function(err, rows) {
    rows.forEach(function(row) {
      //console.log(row.id, row.username);
      resp[i] = new Object();
      resp[i].id = row.user;
      resp[i].username = row.recipient;
      resp[i].awardcount = row.count;
      
      
      i = i + 1;
      
      
    })


  


    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(resp));

  });

  



 




});







router.post('/login', passport.authenticate('user-local', { successRedirect: '/' }));

router.post('/admin-login', passport.authenticate('admin-local', { successRedirect: '/administration' }));

router.get('/logout', user.logout);

router.post('/register', upload.single('signature'), user.register);

router.get('/mysignature', user.mysignature);

router.get('/reports', function(req, res) {
 if (req.isAuthenticated() && req.user.is_admin === 1) {

    var department = parseInt(req.query['department']);
    var division = parseInt(req.query['division']);
    var params = [];
    var filter = ''
    if (department) {
      filter += ' dp.id = ?';
      params.push(department);
    }
    if (division) {
      if (params.length > 0) {
        filter += ' AND'
      }
      filter += ' dv.id = ?';
      params.push(division);
    }
    if (params.length > 0) {
      filter = ' WHERE' + filter;
    }

    var show = req.query['show'];

    if (show === 'users') {
      var query = 'SELECT u.name AS name, username AS email, dv.name AS division, dp.name AS department, COUNT(e.id) AS count FROM entries e LEFT JOIN classes c ON class = c.id LEFT JOIN users u ON e.user = u.id LEFT JOIN divisions dv ON u.division = dv.id LEFT JOIN departments dp ON u.department = dp.id' + filter + ' GROUP BY u.id';

      db.all('SELECT id, name, id IS ? AS selected FROM departments', department ? department : 0, function(err, departments) {
        db.all('SELECT id, name, id IS ? AS selected FROM divisions', division ? division : 0, function(err, divisions) {
          db.all(query, ...params, function(err, users) {
            if (req.query['submit'] === 'csv') {
              res.setHeader('Content-Disposition', 'attachment; filename=results.csv');
              res.setHeader('Content-Type', 'text/csv');
              res.send(csv.export(users, ['name', 'email', 'division', 'department', 'count'], ['Name', 'Email', 'Division', 'Department', 'Count']));
            }
            else {
              res.render('userstats', { title: 'User Statistics', users: users, departments: departments, divisions: divisions });
            }
          });          
        });
      });
    }
    else {
      var query = 'SELECT u.name AS sender, signature, c.name AS type, class, recipient, email, granted, dv.name AS division, dp.name AS department FROM entries LEFT JOIN classes c ON class = c.id LEFT JOIN users u ON user = u.id LEFT JOIN divisions dv ON u.division = dv.id LEFT JOIN departments dp ON u.department = dp.id' + filter + ' ORDER BY granted DESC';
      db.all('SELECT id, name, id IS ? AS selected FROM departments', department ? department : 0, function(err, departments) {
        db.all('SELECT id, name, id IS ? AS selected FROM divisions', division ? division : 0, function(err, divisions) {
          db.all(query, ...params, function(err, entries) {
            if (req.query['submit'] === 'csv') {
              res.setHeader('Content-Disposition', 'attachment; filename=results.csv');
              res.setHeader('Content-Type', 'text/csv');
              res.send(csv.export(entries, ['sender', 'type', 'recipient', 'email', 'granted', 'division', 'department'], ['Sender', 'Type', 'Recipient', 'Email', 'Granted', 'Division', 'Department']));
            }
            else {
              res.render('allawards', { title: 'All Awards', entries: entries, departments: departments, divisions: divisions });
            }
          });          
        });
      });
    }

  }
  else {
    res.redirect('/');
  }
});


router.post('/deleteuser', admin.deleteuser);

router.post('/edituser', admin.edituser);

router.post('/retrieveuserlist', admin.retrieveuserlist);

router.post('/sendaward', award.send);

router.get('/test-download', award.test);

router.get('/award-preview', award.preview);

router.post('/addaward', admin.addaward);

router.post('/deleteaward', admin.deleteaward);

router.post('/retrieveawardlist', admin.retrieveawardlist);




router.get('/userSettings', function(req, res) 
{
  
  res.render('settings', { title: 'Settings' });


});

router.post('/edituserFromSettings', user.edituserFromSettings);

router.post('/retrieveuserlistFromSettings', user.retrieveuserlistFromSettings);




module.exports = router;
