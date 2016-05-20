'use strict';

var express = require('express');
var passport = require('passport');
var config = require('../config/environment');
var User = require('../models/user.model');

// Passport Configuration
// require('./local/passport').setup(User, config);
// require('./mobile/passport').setup(User, config);
require('./facebook/passport').setup(User, config);
require('./google/passport').setup(User, config);
require('./twitter/passport').setup(User, config);

var router = express.Router();

router.use('/local', require('./local'));
router.use('/mobile', require('./mobile'));
router.use('/facebook', require('./facebook'));
router.use('/twitter', require('./twitter'));
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

router.get('/confirm-email-change/:token', function(req, res){
  User.findOne({
    changeEmailToken: req.params.token
  }).exec(function(err, user){
    if(err || !user){
      return res.redirect('/error/404');
    }

    if (new Date(user.expired) < new Date() )
    {
      return res.redirect('/error/404');
    }

    //update token
    user.confirmEmailChange(function(err){
      if(err){ return res.sendStatus(500); }

      //redirect to success page
      res.redirect('/signin?action=verifyEmailChange');
    });
  });
});

module.exports = router;