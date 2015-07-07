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
      subject: 'Confirm email from buiilt.com'
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