/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Mailer = require('./../../components/Mailer');
var EventBus = require('./../../components/EventBus');
var config = require('./../../config/environment');
var User = require('./../../models/user.model');

/**
 * event handler after creating new account
 */
EventBus.onSeries('ResetPassword.Inserted', function(resetPassword, next) {
  User.findOne({email : resetPassword.email},function(err,user) {
    if (err) {return next();}
    Mailer.sendMail('reset-password.html',config.emailFrom, resetPassword.email, {
      name: user.firstName + ' ' + user.lastName,
      resetPassword: config.baseUrl + 'reset-password?token=' + resetPassword.resetPasswordToken,
      subject: 'Please confirm your password change with buiilt'
    }, function(){
      return next();
    });
  });
});