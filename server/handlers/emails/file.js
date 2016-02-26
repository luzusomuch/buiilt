'use strict';

var EventBus = require('./../../components/EventBus');
var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var Team = require('./../../models/team.model');
var Mailer = require('./../../components/Mailer');
var PackageInvite = require('./../../models/packageInvite.model');
var People = require('./../../models/people.model');
var _ = require('lodash');
var config = require('./../../config/environment');
var async = require('async');


EventBus.onSeries('File.Inserted', function(request, next) {
    return next();
});

EventBus.onSeries('File.Updated', function(request, next) {
    return next();
});