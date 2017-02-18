var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var award = require("../award/index");
var moment = require('moment');

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
  if (req.user) {
    if (req.user.is_admin === 1) {
      res.redirect('/administration');
    }
    else {
      db.all('SELECT * FROM classes', function(err, classes) {
        db.all('SELECT * FROM entries LEFT JOIN classes c ON class = c.id WHERE user = ?', req.user.id, function(err, entries) {
          console.log(entries);
          res.render('awardDisplay', { title: 'Awards', user: req.user.name, classes: classes, entries: entries });
        });
      });

    }
  }
  else {

    res.render('index', { title: 'Employee Recognition' });
  }
});

router.get('/userRegistration', function(req, res, next) {
  res.render('userRegistration', { title: 'User Registration' });
});

router.get('/administration', function(req, res, next) {
  if (req.isAuthenticated() && req.user.is_admin === 1) {
    next();
  }
  else {
    res.render('adminLogin', { title: 'Administration Login' });
  }
} , function(req, res) {
  res.render('administration', { title: 'Administration' });
});

router.get('/chart', function(req, res, next) {
  res.render('chart', { title: 'chart' });
});

router.post('/login', passport.authenticate('user-local', { successRedirect: '/' }));

router.post('/admin-login', passport.authenticate('admin-local', { successRedirect: '/administration' }));

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

  var stmt = db.prepare( "INSERT INTO users (username, password, salt, is_admin, created, name) VALUES (?, ?, ?, 0, ?, ?)" );
  stmt.run(username, hashPassword(password, salt), salt, Math.floor(Date.now() / 1000), req.body.name, function(err, row) {
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

router.get('/test-download', function(req, res) {
  res.setHeader('Content-disposition', 'attachment; filename=award.pdf');
  res.setHeader('Content-type', 'application/pdf');
  award.test().pipe(res);
});

router.get('/award-preview', function(req, res) {
  if (req.user) {
    var name = req.param('name');
    var awardtype = req.param('awardtype');
    var date = req.param('date');

    db.get('SELECT name FROM classes WHERE id = ?', awardtype, function(err, awardtyperow) {
      
      res.setHeader('Content-disposition', 'attachment; filename=award.pdf');
      res.setHeader('Content-type', 'application/pdf');
      award.generate(name, awardtyperow['name'], date, req.user.name).pipe(res);
    });
  }
  else {
    res.redirect('/');
  }
});

router.post('/deleteuser', function(req, res, next) {
  console.log("User deletion post request received.");
  console.log("userid is: " + req.body.userid);

  // var id = req.body.id; //for post 
  //id = null; 
  
  var userid = req.body.userid;
  
  var stmt = db.prepare( "DELETE FROM users WHERE id = ?" );
  
  stmt.run(userid, function(err, row) {
    if (err) {
      res.send("Error deleting user" + err);  
    }
    else {
    console.log("id: " + userid);

    
    res.send("User deleted");  
    
    }
  });
  stmt.finalize(); 


});

router.post('/edituser', function(req, res, next) {
  console.log("User edit post request received.");
  console.log("userid is: " + req.body.userid);
  console.log("username is: " + req.body.username);
  console.log("firstname is: " + req.body.firstname);
  console.log("lastname is: " + req.body.lastname);

  // var id = req.body.id; //for post 
  //id = null; 
  
  var userid = req.body.userid;
  var username = req.body.username;
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  
  //var stmt = db.prepare( "UPDATE users SET username = ?, firstname = ?, lastname = ? WHERE id = ?" );
  var stmt = db.prepare( "UPDATE users SET username = ? WHERE id = ?" );
  
  stmt.run(username, userid, function(err, row) {
    if (err) {
      res.send("Error editing user" + err);  
    }
    else {
    console.log("id: " + userid);

    
    res.send("User edited");  
    
    }
  });
  stmt.finalize(); 


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

router.post('/sendaward', function(req, res, next) {
  if (req.user) {
    var transporter = nodemailer.createTransport('smtps://recognitionprog%40gmail.com:pa1234ss@smtp.gmail.com');
    
    var name = req.body.name;
    var awardtype = req.body.awardtype;
    var date = moment(req.body.date).format("X");

    db.get('SELECT name FROM classes WHERE id = ?', awardtype, function(err, awardtyperow) {
      var awardfile = award.generate(name, awardtyperow['name'], date, req.user.name);
      //awardfile.pause();
      console.log(awardfile);
      var mailOptions = {
        from: '"Gemini Company Awards" <recognitionprog@gmail.com>',
        to: '"' + req.body.name + '" <' + req.body.email + '>',
        subject: 'You\'ve received an award!',
        text: 'You\'ve received an award!',
        html: 'You\'ve received an award!', // html body

        // attachments: [
        //     {
        //         filename: 'award.pdf',
        //         content: awardfile
        //     }
        // ]
      };

      transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }

        console.log('Message sent: ' + info.response);

        db.run("INSERT INTO entries (class, recipient, email, user, granted) VALUES (?, ?, ?, ?, ?)",
            awardtype, name, req.body.email, req.user.id, date, function(err, row) {
          if (err) {
            res.send("Error registering user" + err);  
          }
          else {
            res.redirect('/');
          }
        });
      });
    });
  }
});

router.post('/sendemail', function(req, res, next) {

  console.log("/sendemail  post request received.");


  console.log("name is: " + req.body.name);
  console.log("email is: " + req.body.email);
  console.log("awardtype is: " + req.body.awardtype);
  console.log("date is: " + req.body.date);

  var name = encodeURIComponent(req.body.name);
  var email = encodeURIComponent(req.body.email);
  var awardtype = encodeURIComponent(req.body.awardtype);
  var date = encodeURIComponent(req.body.date);
  var awardurl = "/award-preview?name=" + name + "&awardtype=" + awardtype + "&date=" + date;
  
  // create reusable transporter object using the default SMTP transport
  //using account recognitionprog with password pa1234ss at gmail
  var transporter = nodemailer.createTransport('smtps://recognitionprog%40gmail.com:pa1234ss@smtp.gmail.com');
  
  // setup e-mail data with unicode symbols
  var mailOptions = {
    from: '"Gemini Company Awards" <recognitionprog@gmail.com>', // sender address
    to: '"req.body.name" <' + req.body.email + '>', // list of receivers
    subject: 'You\'ve received an award!', // Subject line
    text: 'Hello world ?', // plaintext body
    html: '<b>Hello world ?</b>', // html body
    
    
    attachments: [
        {   // utf-8 string as an attachment
            filename: 'text1.txt',
            content: 'Congratulations! \nYou have received an award! \n' + 'name: ' + req.body.name + '\nemail: ' + req.body.email 
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



router.post('/addaward', function(req, res, next) {
  console.log("/addaward  post request received.");
  console.log("name is: " + req.body.name);
  console.log("email is: " + req.body.email);
  console.log("awardtype is: " + req.body.awardtype);
  console.log("date is: " + req.body.date);
  // var id = req.body.id; //for post 
  //id = null; 
  
  var name = req.body.name;
  var email = req.body.email;

  //var awardtype = req.body.awardtype;
  //var date = req.body.date;
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


});

router.post('/deleteaward', function(req, res, next) {
  console.log("award deletion post request received.");
  console.log("awardid is: " + req.body.awardid);

  // var id = req.body.id; //for post 
  //id = null; 
  
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


});


router.post('/retrieveawardlist', function(req, res, next) {

  console.log("/retrieveawardlist post request received.");


  // var id = req.body.id; //for post 
  //id = null; 
  
  //var resp = new Object();
  
  var resp = new Array();
  
  var i = 0;
  
  

  
  db.all("SELECT id, recipient, email, class, granted FROM entries", function(err, rows) {
    rows.forEach(function(row) {
      //console.log(row.id, row.username);
      resp[i] = new Object();
      resp[i].id = row.id;
      resp[i].recipient = row.recipient;
      resp[i].email = row.email;
      resp[i].class = row.class;
      resp[i].granted = row.granted;


      
      
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









module.exports = router;
