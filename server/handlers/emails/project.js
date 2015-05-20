/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Mailer = require('./../../components/Mailer');
var EventBus = require('./../../components/EventBus');
var User = require('./../../models/user.model');
var config = require('./../../config/environment');

/**
 * event handler after creating new account
 */
EventBus.onSeries('Project.Inserted', function(project, next) {
  //find user to send email

  next();
});