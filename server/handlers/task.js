var _ = require('lodash');
'use strict';

var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var NotificationHelper = require('./../components/helpers/notification');
var Notification = require('./../models/notification.model');
var config = require('./../config/environment');
var async = require('async');
var _ = require('lodash');

EventBus.onSeries('Task.Inserted', function(task, next){
  if (task.assignees.length > 0) {
    var params = {
      owners : task.assignees,
      fromUser : task.user,
      element : task,
      referenceTo : 'task',
      type : 'taskAssign'
    };
    NotificationHelper.create(params,function(err) {
      if (err) {
        console.log(err);
      }
      next();
    });
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
    var params = {
      owners : owners,
      fromUser : task.editUser,
      element : task,
      referenceTo : 'task',
      type : task.completed ? 'taskCompleted' : 'taskReopened'
    };
    NotificationHelper.create(params,function(err) {
      if (err) {
        console.log(err);
      }
      next();
    });
  } else if (task._modifiedPaths.indexOf('assignees') != -1) {
    async.parallel([
      function(callback) {
        if (task._oldAssignees.length > 0) {
          var owners = task.assignees.slice();
          task._oldAssignees.forEach(function (assignee) {
            if (task.assignees.indexOf(assignee) == -1) {
              owners.push(assignee);
              var params = {
                owners: owners,
                fromUser: task.editUser,
                element: task,
                referenceTo: 'task',
                type: 'taskRevoke'
              };
              NotificationHelper.create(params, function (err) {
                if (err) {
                  return callback(err, null);
                }

              });
            }
          });
          return callback(null, null);
        } else {
          var params = {
            owners : task.assignees,
            fromUser : task.user,
            element : task,
            referenceTo : 'task',
            type : 'taskAssign'
          };
          NotificationHelper.create(params,function(err) {
            if (err) {
              console.log(err);
            }
            next();
          });
        }
      },
      function(callback) {
        if (task._oldAssignees.length > 0) {
          task._oldAssignees = task._oldAssignees.map(function (e) { return e.toString(); });
          task.assignees.forEach(function(assignee) {
            if (task._oldAssignees.indexOf(assignee.toString()) == -1) {
              var params = {
                owners : task.assignees,
                fromUser : task.editUser,
                toUser: assignee,
                element : task,
                referenceTo: 'task',
                type: 'taskAssign'
              };
              NotificationHelper.create(params,function(err) {
                if (err) {
                  callback(err,null);
                }
              });
            }
          });
        }
        return callback();
      }
    ],function() {
      next();
    })
  } else {
    next();
  }
});