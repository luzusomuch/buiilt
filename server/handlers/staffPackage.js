'use strict';

var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var Project = require('./../models/project.model');
var StaffPackage = require('./../models/staffPackage.model');
var Team = require('./../models/team.model');
var Notification = require('./../models/notification.model');
var NotificationHelper = require('./../components/helpers/notification');
var Mailer = require('./../components/Mailer');
var _ = require('lodash');
var async = require('async');

EventBus.onSeries('StaffPackage.Updated', function(staffPackage, next) {
  if (staffPackage._modifiedPaths.indexOf('sendDefect') != -1) {
    var owners = [];
    StaffPackage.findById(staffPackage._id).populate('owner').exec(function(err, staffPackage) {
      if (err || !staffPackage) {
        next();
      }
      else {
        owners = _.union(staffPackage.owner.leader, staffPackage.staffs);
        var params = {
          owners: owners,
          fromUser: staffPackage.editUser,
          element: staffPackage,
          referenceTo: 'StaffPackage',
          type: 'send-defect'
        };
        NotificationHelper.create(params, function() {
          next();
        });
      }
    });
  }
  else if (staffPackage._modifiedPaths.indexOf('sendInvoice') != -1) {
    var owners = [];
    StaffPackage.findById(staffPackage._id).populate('owner').exec(function(err, staffPackage) {
      if (err || !staffPackage) {
        next();
      }else {
        owners = _.union(staffPackage.owner.leader, staffPackage.staffs);
        var params = {
          owners: owners,
          fromUser: staffPackage.editUser,
          element: staffPackage,
          referenceTo: 'StaffPackage',
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