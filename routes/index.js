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
var chart = require('./chart');

router.get('/', site.index);

router.get('/userRegistration', site.registration);

router.get('/administration', site.administration);

router.get('/chart', chart.chart);

router.post('/getuserawardcount', chart.getuserawardcount);

router.post('/getemployeeawardcount', chart.getemployeeawardcount);

router.post('/login', passport.authenticate('user-local', { successRedirect: '/' }));

router.post('/admin-login', passport.authenticate('admin-local', { successRedirect: '/administration' }));

router.get('/logout', user.logout);

router.post('/register', upload.single('signature'), user.register);

router.get('/mysignature', user.mysignature);

router.get('/reports', admin.reports);

router.post('/deleteuser', admin.deleteuser);

router.post('/edituser', admin.edituser);

router.post('/retrieveuserlist', admin.retrieveuserlist);

router.post('/sendaward', award.send);

router.get('/test-download', award.test);

router.get('/award-preview', award.preview);

router.post('/addaward', admin.addaward);

router.post('/deleteaward', admin.deleteaward);

router.post('/retrieveawardlist', admin.retrieveawardlist);

router.get('/userSettings', site.userSettings);

router.post('/edituserFromSettings', user.edituserFromSettings);

router.post('/retrieveuserlistFromSettings', user.retrieveuserlistFromSettings);




module.exports = router;
