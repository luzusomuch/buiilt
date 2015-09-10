/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Mailer = require('./../../components/Mailer');
var EventBus = require('./../../components/EventBus');
var config = require('./../../config/environment');

/**
 * event handler after creating new account
 */
EventBus.onSeries('User.Inserted', function(user, next) {
  if(!user.emailVerified){
    Mailer.sendMail('confirm-email.html', user.email, {
      user: user.toJSON(),
      confirmation: config.baseUrl + 'auth/confirm-email/' + user.emailVerifyToken,
      subject: 'Please confirm your email address for buiilt'
    }, function(err){
      return next();
    });
  }else{
    return next();
  }
});

EventBus.onSeries('User.Updated', function(user, next) {
  return next();
});

EventBus.onSeries('User.ChangeEmail', function(user, next) {
  Mailer.sendMail('confirm-change-email.html', user.email, {
    user: user.toJSON(),
    emailChange : user.emailChange,
    confirmation: config.baseUrl + 'auth/confirm-email-change/' + user.changeEmailToken,
<<<<<<< HEAD
    subject: 'Please confirm your email address with buiilt'
=======
    subject: 'Please confirm your password change for buiilt'
>>>>>>> 1caf6089273d2757f87127ead18b68c86d4a5913
  }, function(err){
    return next();
  });
});
