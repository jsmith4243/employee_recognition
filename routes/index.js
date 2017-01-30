var express = require('express');
var router = express.Router();
var crypto = require('crypto');



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

router.get('/chart', function(req, res, next) {
  res.render('chart', { title: 'chart' });
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
  console.log("User registration post request received.");
  console.log("username is: " + req.body.username);
  console.log("password is: " + req.body.password);
  console.log("firstname is: " + req.body.firstname);
  console.log("lastname is: " + req.body.lastname);
  // var id = req.body.id; //for post 
  //id = null; 
  
  var username = req.body.username;
  var password = req.body.password;
  var salt = crypto.randomBytes(128).toString('base64');

  var stmt = db.prepare( "INSERT INTO users (username, password, salt, is_admin, created) VALUES (?, ?, ?, 0, ?)" );
  stmt.run(username, hashPassword(password, salt), salt, Math.floor(Date.now() / 1000), function(err, row) {
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

router.post('/deleteuser', function(req, res, next) {
  console.log("User deletion post request received.");
  console.log("userid is: " + req.body.userid);

  // var id = req.body.id; //for post 
  //id = null; 
  
  var userid = req.body.userid;


});

router.post('/edituser', function(req, res, next) {
  console.log("User edit post request received.");
  console.log("userid is: " + req.body.userid);

  // var id = req.body.id; //for post 
  //id = null; 
  
  var userid = req.body.userid;


});

router.post('/retrieveuserlist', function(req, res, next) {

  console.log("retrieve user list post request received.");


  // var id = req.body.id; //for post 
  //id = null; 
  
  //var resp = new Object();
  
  var resp = new Array();
  
  var i = 0;
  
  

  
  db.all("SELECT id, username, is_admin, name, created FROM users", function(err, rows) {
    rows.forEach(function(row) {
      //console.log(row.id, row.username);
      resp[i] = new Object();
      resp[i].id = row.id;
      resp[i].username = row.username;
      
      
      i = i + 1;
      
      
    })
    
    /*
    console.log("i: " + i);
    console.log("resp[0].username:" + resp[1].username);
    console.log(JSON.stringify(resp));
    */
    
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(resp));
    
  });
  
  //
  
  



});

router.post('/sendemail', function(req, res, next) {

  console.log("/sendemail  post request received.");
  
  // create reusable transporter object using the default SMTP transport
  //using account recognitionprog with password pa1234ss at gmail
  var transporter = nodemailer.createTransport('smtps://recognitionprog%40gmail.com:pa1234ss@smtp.gmail.com');
  
  // setup e-mail data with unicode symbols
  var mailOptions = {
    from: '"Fred Foo ?" <foo@blurdybloop.com>', // sender address
    to: 'recognitionprog@gmail.com, baz@blurdybloop.com', // list of receivers
    subject: 'Hello ✔', // Subject line
    text: 'Hello world ?', // plaintext body
    html: '<b>Hello world ?</b>', // html body
    
    
    attachments: [
        {   // utf-8 string as an attachment
            filename: 'text1.txt',
            content: 'hello world!'
        }
    ]
    
/*
    attachments: [
        {   // utf-8 string as an attachment
            filename: 'text1.txt',
            content: 'hello world!'
        },
        {   // binary buffer as an attachment
            filename: 'text2.txt',
            content: new Buffer('hello world!','utf-8')
        },
        {   // file on disk as an attachment
            filename: 'text3.txt',
            path: '/path/to/file.txt' // stream this file
        },
        {   // filename and content type is derived from path
            path: '/path/to/file.txt'
        },
        {   // stream as an attachment
            filename: 'text4.txt',
            content: fs.createReadStream('file.txt')
        },
        {   // define custom content type for the attachment
            filename: 'text.bin',
            content: 'hello world!',
            contentType: 'text/plain'
        },
        {   // use URL as an attachment
            filename: 'license.txt',
            path: 'https://raw.github.com/nodemailer/nodemailer/master/LICENSE'
        },
        {   // encoded string as an attachment
            filename: 'text1.txt',
            content: 'aGVsbG8gd29ybGQh',
            encoding: 'base64'
        },
        {   // data uri as an attachment
            path: 'data:text/plain;base64,aGVsbG8gd29ybGQ='
        },
        {
            // use pregenerated MIME node
            raw: 'Content-Type: text/plain\r\n' +
                 'Content-Disposition: attachment;\r\n' +
                 '\r\n' +
                 'Hello world!'
        }
    ]
*/

    
    
    
    
  };
  
  // send mail with defined transport object
  transporter.sendMail(mailOptions, function(error, info){
    if(error){
        return console.log(error);
    }
    console.log('Message sent: ' + info.response);
  });

  // var id = req.body.id; //for post 
  //id = null; 
  
  console.log("userid is: " + req.body.userid);
  var userid = req.body.userid;
  
  res.send("mail sent");


});

module.exports = router;
