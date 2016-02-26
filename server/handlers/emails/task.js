var Mailer = require('./../../components/Mailer');
var Team = require('./../../models/team.model');
var Project = require('./../../models/project.model');
var EventBus = require('./../../components/EventBus');
var User = require('./../../models/user.model');
var config = require('./../../config/environment');
var async = require('async');
var PackageInvite = require('./../../models/packageInvite.model');
var _ = require('lodash');

EventBus.onSeries('Task.Inserted', function(req, next){
    return next();
});

EventBus.onSeries('Task.Updated', function(req, next){
    return next();
});