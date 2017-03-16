var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var award = require("../award/index");
var csv = require('../csv/index');
var moment = require('moment');
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

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
})

router.post('/register', upload.single('signature'), function(req, res, next) {
  console.log("User registration post request received.");
  console.log("username is: " + req.body.username);
  console.log("password is: " + req.body.password);
  console.log("name is: " + req.body.name);
  console.log("filename is: " + req.file.filename);
  console.log("mimetype is: " + req.file.mimetype);
  // var id = req.body.id; //for post 
  //id = null; 
  
  var username = req.body.username;
  var password = req.body.password;
  var salt = crypto.randomBytes(128).toString('base64');

  var stmt = db.prepare( "INSERT INTO users (username, password, salt, is_admin, created, name, signature, mimetype) VALUES (?, ?, ?, 0, ?, ?, ?, ?)" );
  stmt.run(username, hashPassword(password, salt), salt, Math.floor(Date.now() / 1000), req.body.name, req.file.filename, req.file.mimetype, function(err, row) {
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

router.get('/mysignature', function(req, res) {
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
      award.generate(name, awardtyperow['name'], date, req.query['sender'] || req.user.name, req.query['signature'] || req.user.signature).pipe(res);
    });
  }
  else {
    res.redirect('/');
  }
});

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
  console.log("name is: " + req.body.name);
  console.log("password is: " + req.body.password);


  // var id = req.body.id; //for post 
  //id = null; 
  
  var userid = req.body.userid;
  var username = req.body.username;

  var firstname = req.body.firstname;
  var lastname = req.body.lastname;

  var name = req.body.name;
  var password = req.body.password;

/*

  var salt = crypto.randomBytes(128).toString('base64');

  var stmt = db.prepare( "INSERT INTO users (username, password, salt, is_admin, created, name, signature, mimetype) VALUES (?, ?, ?, 0, ?, ?, ?, ?)" );
  stmt.run(username, hashPassword(password, salt), salt, Math.floor(Date.now() / 1000),

*/

  var salt = crypto.randomBytes(128).toString('base64');
  
  //var stmt = db.prepare( "UPDATE users SET username = ?, firstname = ?, lastname = ? WHERE id = ?" );
  //var stmt = db.prepare( "UPDATE users SET username = ? WHERE id = ?" );
  var stmt = db.prepare( "UPDATE users SET username = ?, password = ?, salt = ?, name = ? WHERE id = ?" );
  
  //stmt.run(username, userid, function(err, row) {
  stmt.run(username, hashPassword(password, salt), salt, name, userid, function(err, row) {
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
      resp[i].name = row.name;
      
      
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
      var awardfile = award.generate(name, awardtyperow['name'], date, req.user.name, req.user.signature);

      crypto.pseudoRandomBytes(16, function (err, raw) {
        var temppath = err ? 'tmp' : raw.toString('hex');
        var tempfile = fs.createWriteStream(temppath);

        tempfile.on('finish', function () {
          console.log(awardfile);
          var mailOptions = {
            from: '"Gemini Company Awards" <recognitionprog@gmail.com>',
            to: '"' + req.body.name + '" <' + req.body.email + '>',
            subject: 'You\'ve received an award!',
            text: 'You\'ve received an award!',
            html: 'You\'ve received an award!', // html body

            attachments: [
                {
                    filename: 'award.pdf',
                    path: temppath
                }
            ]
          };

          transporter.sendMail(mailOptions, function(error, info){
            fs.unlink(temppath);
            if(error){
                return console.log(error);
            }

            console.log('Message sent: ' + info.response);


            db.run("INSERT INTO entries (class, recipient, email, user, granted) VALUES (?, ?, ?, ?, ?)",
                awardtype, name, req.body.email, req.user.id, date, function(err, row) {
              if (err) {
                res.send("Error sending award " + err);  
              }
              else {
                res.redirect('/');
              }
            });
          });
        });
        awardfile.pipe(tempfile);
        // tempfile.end();
      });
    });
  }
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
  var awardedby = req.body.awardedby

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


 
  //db.run("UPDATE users SET awardcount = awardcount + 1 WHERE username = " + awardedby);


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




router.get('/userSettings', function(req, res) 
{
  
  res.render('settings', { title: 'Settings' });


});

router.post('/edituserFromSettings', function(req, res, next) {
  console.log("User edit post request received.");
  //console.log("userid is: " + req.body.userid);
  console.log("userid is: " + req.user.id);
  console.log("username is: " + req.body.username);
  console.log("name is: " + req.body.name);
  console.log("lastname is: " + req.body.lastname);
  console.log("new password is: " + req.body.password);


  // var id = req.body.id; //for post 
  //id = null; 
  
  var userid = req.user.id;
  var username = req.body.username;
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var name = req.body.name;

  var password = req.body.password;
  var salt = crypto.randomBytes(128).toString('base64');
  var passwordhash = hashPassword(password, salt);



  
  //var stmt = db.prepare( "UPDATE users SET username = ?, firstname = ?, lastname = ? WHERE id = ?" );
  var stmt = db.prepare( "UPDATE users SET username = ?, name = ?, password = ?, salt = ? WHERE id = ?" );
  
  stmt.run(username,  name, passwordhash, salt, userid, function(err, row) {
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






router.post('/retrieveuserlistFromSettings', function(req, res, next) {

  console.log("retrieve user list from settings post request received.");


  // var id = req.body.id; //for post 
  //id = null; 
  
  //var resp = new Object();


  
  var resp = new Array();
  
  var i = 0;
  
  var idofcurrentuser;

  console.log("flag1a");


  var idofcurrentuser = req.user.id;

  console.log("flag11");

  console.log("id of current user is: " + idofcurrentuser);

  
  //db.all("SELECT id, username, is_admin, name, created FROM users WHERE id = " + idofcurrentuser , function(err, rows) {
  db.all("SELECT id, username, is_admin, name, created, password FROM users WHERE id = " + idofcurrentuser , function(err, rows) {
    rows.forEach(function(row) {
      //console.log(row.id, row.username);


      console.log("row.username is: " + row.username);

      resp[i] = new Object();
      resp[i].id = row.id;
      resp[i].username = row.username;
      resp[i].password = row.password;
      resp[i].name = row.name;
      
      
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
