/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var User = require('./../models/user.model');
var EventBus = require('./../components/EventBus');
var _ = require('lodash');
var config = require('./../config/environment');


/**
 * create new Twilio number for new user
 */
EventBus.onSeries('User.Created', function (user, next) {
  next();
});