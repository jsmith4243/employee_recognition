var express = require('express');
var router = express.Router();
var crypto = require('crypto');
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

var passport = require('passport');

var award = require('./award');
var site = require('./site');
var user = require('./user');
var admin = require('./admin');
var chart = require('./chart');

router.get('/', site.index);
router.get('/userRegistration', site.registration);
router.get('/administration', function(req, res, next) {
  if (req.isAuthenticated() && req.user.is_admin === 1) {
    next();
  }
  else {
    res.render('adminLogin', { title: 'Administration Login' });
  }
}, site.administration);
router.get('/userSettings', site.userSettings);

router.post('/login', passport.authenticate('user-local', { successRedirect: '/' }));
router.post('/admin-login', passport.authenticate('admin-local', { successRedirect: '/administration' }));

router.get('/logout', user.logout);
router.post('/register', upload.single('signature'), user.register);
router.get('/mysignature', user.mysignature);
router.get('/resetpassword', user.passwordresetget);
router.post('/resetpassword', user.passwordresetpost);
router.post('/edituserFromSettings', user.edituserFromSettings);
router.post('/retrieveuserlistFromSettings', user.retrieveuserlistFromSettings);

router.get('/test-download', award.test);
router.get('/award-preview', award.preview);
router.post('/sendaward', award.send);

router.get('/reports', admin.reports);
router.post('/deleteuser', admin.deleteuser);
router.post('/edituser', admin.edituser);
router.post('/retrieveuserlist', admin.retrieveuserlist);
router.post('/addaward', admin.addaward);
router.post('/deleteaward', admin.deleteaward);
router.post('/retrieveawardlist', admin.retrieveawardlist);

router.get('/chart', chart.chart);
router.post('/getuserawardcount', chart.getuserawardcount);
router.post('/getemployeeawardcount', chart.getemployeeawardcount);

module.exports = router;
