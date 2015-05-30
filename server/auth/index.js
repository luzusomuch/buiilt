'use strict';

var express = require('express');
var passport = require('passport');
var config = require('../config/environment');
var User = require('../models/user.model');

// Passport Configuration
require('./local/passport').setup(User, config);
require('./facebook/passport').setup(User, config);
require('./google/passport').setup(User, config);
require('./twitter/passport').setup(User, config);

var router = express.Router();

router.use('/local', require('./local'));
router.use('/facebook', require('./facebook'));
router.use('/twitter', require('./twitter'));
router.use('/google', require('./google'));
router.use('/google', require('./google'));
router.get('/confirm-email/:token', function(req, res){
  User.findOne({
    emailVerifyToken: req.params.token
  }).exec(function(err, user){
    if(err || !user){
      return this.sendStatus(404);
    }

    //update token
    user.confirmEmail(function(err){
      if(err){ return res.sendStatus(500); }

      //redirect to success page
      res.redirect('/signin?action=verifyEmailSuccess');
    });
  });
});

module.exports = router;