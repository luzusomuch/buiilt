'use strict';

var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var NotificationHelper = require('./../components/helpers/notification');
var Notification = require('./../models/notification.model');
var config = require('./../config/environment');
var async = require('async');
var _ = require('lodash');
var PushNotificationHelper = require('./../components/helpers/PushNotification');

EventBus.onSeries('Task.Inserted', function(task, next){
  if (task.members.length > 0) {
    _.remove(task.members, function(item) {
      return item == task.editUser._id.toString();
    });
    var params = {
      owners : task.members,
      fromUser : task.user,
      element : task,
      referenceTo : 'task',
      type : 'task-assign'
    };
    NotificationHelper.create(params, function() {
      next();
    });
    PushNotificationHelper.getData(task.project,task._id,task.name, 'has assigned to you', task.assignees, 'task');
  } else {
    next();
  }
});

EventBus.onSeries('Task.Updated', function(task, next){
  if (task._modifiedPaths.indexOf('completed') != -1) {
    var owners = task.assignees.slice();
    if (task.assignees.indexOf(task.user) == -1) {
      owners.push(task.user);
    }
    
    _.remove(owners, task.editUser._id);

    var params = {
      owners : owners,
      fromUser : task.editUser,
      element : task,
      referenceTo : 'task',
      type : task.completed ? 'task-completed' : 'task-reopened'
    };
    NotificationHelper.create(params, function() {
      return next();
    });
  } else if (task._modifiedPaths.indexOf('assignees') != -1) {
    async.parallel([
      function(callback) {
        if (task._oldAssignees.length > 0) {
          var owners = task.assignees.slice();
          async.each(task._oldAssignees, function (assignee, cb) {
            if (task.assignees.indexOf(assignee) == -1) {
              owners.push(assignee);
              var params = {
                owners: owners,
                fromUser: task.editUser,
                element: task,
                referenceTo: 'task',
                type: 'task-revoke'
              };

              NotificationHelper.create(params, cb);
            } else{
              return cb();
            }
          }, callback);

        } else {
          var params = {
            owners : task.assignees,
            fromUser : task.user,
            element : task,
            referenceTo : 'task',
            type : 'task-assign'
          };
          NotificationHelper.create(params, callback);
        }
      },
      function(callback) {
        if (task._oldAssignees.length > 0) {
          task._oldAssignees = task._oldAssignees.map(function (e) { return e.toString(); });
          async.each(task.assignees, function(assignee, cb) {
            if (task._oldAssignees.indexOf(assignee.toString()) != -1) {
              return cb();
            }
            
            var params = {
              owners : task.assignees,
              fromUser : task.editUser,
              toUser: assignee,
              element : task,
              referenceTo: 'task',
              type: 'task-assign'
            };
            NotificationHelper.create(params, cb);
          }, callback);
        }else{
          return callback();
        }
      }
    ],function() {
      next();
    });
  } else {
    return next();
  }
});