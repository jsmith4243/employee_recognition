var award = require("../award/index");
var crypto = require('crypto');
var db = require('../db/index');
var fs = require('fs');
var moment = require('moment');
var nodemailer = require('nodemailer');

exports.send = function(req, res, next) {
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
                res.render('message', { title: 'Error', text: 'Error sending award: ' + err, next: '/' });  
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
};

exports.test = function(req, res) {
  res.setHeader('Content-disposition', 'attachment; filename=award.pdf');
  res.setHeader('Content-type', 'application/pdf');
  award.test().pipe(res);
};

exports.preview = function(req, res) {
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
};
