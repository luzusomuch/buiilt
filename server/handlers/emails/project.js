/**
 * Broadcast updates to client when the model changes
 */
var _ = require('lodash');
'use strict';

var Mailer = require('./../../components/Mailer');
var Team = require('./../../models/team.model');
var EventBus = require('./../../components/EventBus');
var User = require('./../../models/user.model');
var config = require('./../../config/environment');
var async = require('async');
var _ = require('lodash');

EventBus.onSeries('Project.Inserted', function(request, next){
    return next();
});
