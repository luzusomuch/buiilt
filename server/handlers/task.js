var _ = require('lodash');
'use strict';

var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var Notification = require('./../models/notification.model');
var config = require('./../config/environment');
var async = require('async');
var _ = require('lodash');

EventBus.onSeries('Task.Inserted', function(task, next){
  task.assignees.forEach(function(assignee) {
    var notification = new Notification({
      owner : assignee,
      fromUser : task.user,
      toUser : assignee,
      element : task,
      referenceTo : 'task',
      type : 'taskAssign'
    });
    notification.save();
  });
  next();
});

EventBus.onSeries('Task.Updated', function(task, next){
  if (task._modifiedPaths.indexOf('completed') != -1) {
    task.assignees.forEach(function(assignee) {
      var notification = new Notification({
        owner : assignee,
        fromUser : task.editUser,
        toUser : assignee,
        element : task,
        referenceTo : 'task',
        type : task.completed ? 'taskCompleted' : 'taskReopened'
      });
      notification.save(function(err) {
        if (err) {
          console.log(err);
        }
      });
    });
    if (task.assignees.indexOf(task.user) == -1) {
      var notification = new Notification({
        owner : task.user,
        fromUser : task.editUser,
        toUser : task.user,
        element : task,
        referenceTo : 'task',
        type : task.completed ? 'taskCompleted' : 'taskReopened'
      });
      notification.save(function(err) {
        if (err) {
          console.log(err);
        }
      });
    }
    next();
  } else if (task._modifiedPaths.indexOf('assignees') != -1) {
    async.parallel([
      function(callback) {
        task._oldAssignees.forEach(function(assignee) {
          if (task.assignees.indexOf(assignee) == -1) {
            var notification = new Notification({
              owner : assignee,
              fromUser : task.editUser,
              toUser : assignee,
              element : task,
              referenceTo : 'task',
              type : 'taskRevoke'
            });
            notification.save();
            task.assignees.forEach(function(_assignee) {
              var notification = new Notification({
                owner : _assignee,
                fromUser : task.editUser,
                toUser : assignee,
                element : task,
                referenceTo : 'task',
                type : 'taskRevoke'
              });
              notification.save(function(err) {
                if (err ) {
                  console.log(err);
                }
              });
            })
          }
        });
        return callback();
      },
      function(callback) {
        if (task._oldAssignees) {
          task._oldAssignees = task._oldAssignees.map(function (e) { return e.toString(); })
          task.assignees.forEach(function(assignee) {
            if (task._oldAssignees.indexOf(assignee.toString()) == -1) {
              task.assignees.forEach(function(_assignee) {
                var notification = new Notification({
                  owner: _assignee,
                  fromUser: task.editUser,
                  toUser: assignee,
                  element: task,
                  referenceTo: 'task',
                  type: 'taskAssign'
                });
                notification.save(function (err) {
                  if (err) {
                    console.log(err);
                  }
                });
              })
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