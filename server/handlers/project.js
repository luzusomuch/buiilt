/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');

/**
 * event handler after creating new account
 */
EventBus.onSeries('Project.Inserted', function(project, next) {
  //create a bulder package
  return next();
});