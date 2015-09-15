/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var Project = require('./../models/project.model');
var BuilderPackage = require('./../models/builderPackage.model');
var Team = require('./../models/team.model');
var Notification = require('./../models/notification.model');
var NotificationHelper = require('./../components/helpers/notification');
var Mailer = require('./../components/Mailer');
var _ = require('lodash');
var async = require('async');

/**
 * event handler after creating new account
 */
EventBus.onSeries('BuilderPackage.Inserted', function(builderPackage, next) {
  if (builderPackage.to.team) {
    Team.findById(builderPackage.to.team, function(err,team){
      if (err || !team) {next();}
      var params = {
        owners: team.leader,
        fromUser: builderPackage.editUser._id,
        element: builderPackage,
        referenceTo: 'BuilderPackage',
        type: 'create-builder-package'
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

EventBus.onSeries('BuilderPackage.Updated', function(builderPackage, next) {
  if (builderPackage._modifiedPaths.indexOf('sendDefect') != -1) {
    var owners = [];
    BuilderPackage.findById(builderPackage._id).populate('owner')
            .populate('to.team').exec(function(err, _builderPackage) {
      if (err || !_builderPackage) {
        next();
      }
      else {
        if (!_builderPackage.to.team) {
          return next();
        }
        owners = _.union(_builderPackage.owner.leader, _builderPackage.to.team.leader);
        var params = {
          owners: owners,
          fromUser: builderPackage.editUser._id,
          element: builderPackage,
          referenceTo: 'BuilderPackage',
          type: 'send-defect'
        };
        NotificationHelper.create(params, function() {
          next();
        });
      }
    });
  }
  else if (builderPackage._modifiedPaths.indexOf('sendVariation') != -1) {
    var owners = [];
    BuilderPackage.findById(builderPackage._id).populate('owner')
            .populate('to.team').exec(function(err, _builderPackage) {
      if (err || !_builderPackage) {
        next();
      }
      else {
        if (!_builderPackage.to.team) {
          return next();
        }
        owners = _.union(_builderPackage.owner.leader, _builderPackage.to.team.leader);
        var params = {
          owners: owners,
          fromUser: builderPackage.editUser._id,
          element: builderPackage,
          referenceTo: 'BuilderPackage',
          type: 'send-variation'
        };
        NotificationHelper.create(params, function() {
          next();
        });
      }
    });
  }
  else if (builderPackage._modifiedPaths.indexOf('sendInvoice') != -1) {
    var owners = [];
    BuilderPackage.findById(builderPackage._id).populate('owner')
            .populate('to.team').exec(function(err, _builderPackage) {
      if (err || !_builderPackage) {
        next();
      }else {
        if (!_builderPackage.to.team) {
          return next();
        }
        owners = _.union(_builderPackage.owner.leader, _builderPackage.to.team.leader);
        var params = {
          owners: owners,
          fromUser: builderPackage.editUser._id,
          element: builderPackage,
          referenceTo: 'BuilderPackage',
          type: 'send-invoice'
        };
        NotificationHelper.create(params, function() {
          next();
        });
      }
    });
  }
  else {
    return next();
  }
});