/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var Project = require('./../models/project.model');
var BuilderPackage = require('./../models/builderPackage.model');
var Mailer = require('./../components/Mailer');
var _ = require('lodash');
var async = require('async');

/**
 * event handler after creating new account
 */
EventBus.onSeries('BuilderPackage.Inserted', function(builderPackage, next) {
  return next();
});