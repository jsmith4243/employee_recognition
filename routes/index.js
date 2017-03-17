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

var isUser = function(req, res, next) {
  if (req.isAuthenticated() && req.user.is_admin === 0) {
    next();
  }
  else {
    res.redirect('/');
  }
};

var isAdmin = function(req, res, next) {
  if (req.isAuthenticated() && req.user.is_admin === 1) {
    next();
  }
  else {
    res.render('adminLogin', { title: 'Administration Login'});
  }
};

router.get('/', site.index);
router.get('/userRegistration', site.registration);
router.get('/administration', isAdmin, admin.reports);
router.get('/userSettings', isUser, site.userSettings);

router.post('/login', passport.authenticate('user-local', { successRedirect: '/' }));
router.post('/admin-login', passport.authenticate('admin-local', { successRedirect: '/administration' }));

router.get('/logout', user.logout);
router.post('/register', upload.single('signature'), user.register);
router.get('/mysignature', user.mysignature);
router.get('/resetpassword', user.passwordresetget);
router.post('/resetpassword', user.passwordresetpost);
router.post('/userSettings', isUser, upload.single('signature'), user.updatesettings);

router.get('/test-download', award.test);
router.get('/award-preview', award.preview);
router.post('/sendaward', award.send);

router.get('/createuser', isAdmin, admin.createuser);
router.get('/createadmin', isAdmin, admin.createadmin);
router.post('/createadmin', isAdmin, admin.createadminpost);
router.get('/edituser', isAdmin, admin.edituserget);
router.post('/deleteuser', isAdmin, admin.deleteuser);
router.post('/deleteadmin', isAdmin, admin.deleteadmin);
router.post('/edituser', isAdmin, admin.edituser);
router.post('/deleteaward', admin.deleteaward);

module.exports = router;
