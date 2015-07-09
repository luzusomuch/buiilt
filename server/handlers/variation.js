
'use strict';

var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var Project = require('./../models/project.model');
var Variation = require('./../models/variation.model');
var Team = require('./../models/team.model');
var Notification = require('./../models/notification.model');
var NotificationHelper = require('./../components/helpers/notification');
var Mailer = require('./../components/Mailer');
var _ = require('lodash');
var async = require('async');

EventBus.onSeries('Variation.Updated', function(request, next) {
    if (request._modifiedPaths.indexOf('sendDefect') != -1) {
        var owners = [];
        Variation.findById(request._id).populate('owner')
                .populate('to._id').exec(function(err, variation) {
            if (err || !variation) {
                next();
            }
            else {
                owners = _.union(variation.owner.leader, variation.to._id.leader);
                var params = {
                    owners: owners,
                    fromUser: request.editUser,
                    element: request,
                    referenceTo: 'Variation',
                    type: 'send-defect'
                };
                NotificationHelper.create(params, function() {
                    next();
                });
            }
        });
    }
    else if (request._modifiedPaths.indexOf('sendInvoice') != -1) {
        var owners = [];
        Variation.findById(request._id).populate('owner')
                .populate('to._id').exec(function(err, variation) {
          if (err || !variation) {
            next();
          }else {
            owners = _.union(variation.owner.leader, variation.to._id.leader);
            var params = {
              owners: owners,
              fromUser: request.editUser,
              element: request,
              referenceTo: 'Variation',
              type: 'send-invoice'
            };
            NotificationHelper.create(params, function() {
              next();
            });
          }
        });
    }
    else if (request._modifiedPaths.indexOf('sendAddendum') != -1) {
        Team.findById(request.to._id, function(err,team){
            if (err || !team) {next();}
            var params = {
              owners: team.leader,
              fromUser: request.editUser,
              element: request,
              referenceTo: 'Variation',
              type: 'send-addendum'
            };
            NotificationHelper.create(params, function() {
              next();
            });
        });
    }
    else if (request._modifiedPaths.indexOf('editAddendum') != -1) {
        Team.findById(request.to._id, function(err, team) {
            if (err || !team) {next();}
            var params = {
              owners: team.leader,
              fromUser: request.editUser,
              element: request,
              referenceTo: 'Variation',
              type: 'edit-addendum'
            };
            NotificationHelper.create(params, function() {
              next();
            });
        });
    }
    else if (request._modifiedPaths.indexOf('sendInvoice') != -1) {
        Team.findById(request.owner, function(err,team){
            if (err || !team) {next();}
            var params = {
              owners: team.leader,
              fromUser: request.editUser,
              element: request,
              referenceTo: 'Variation',
              type: 'send-invoice'
            };
            NotificationHelper.create(params, function() {
              next();
            });
        });
    }
    else if (request._modifiedPaths.indexOf('selectQuote') != -1) {
        Team.findById(request.to._id, function(err,team){
            if (err || !team) {next();}
            var params = {
              owners: team.leader,
              fromUser: request.editUser,
              element: request,
              referenceTo: 'Variation',
              type: 'select-quote'
            };
            NotificationHelper.create(params, function() {
              next();
            });
        });
    }
    else {
        return next();
    }
});