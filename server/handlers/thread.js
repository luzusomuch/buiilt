'use strict';

var _ = require('lodash');
var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var Notification = require('./../models/notification.model');
var NotificationHelper = require('./../components/helpers/notification');
var PushNotificationHelper = require('./../components/helpers/PushNotification');
var config = require('./../config/environment');
var async = require('async');
var _ = require('lodash');

EventBus.onSeries('Thread.Inserted', function(thread, next) {
    if (thread.members.length > 0) {
        var params = {
            owners: thread.members,
            fromUser: thread.owner,
            element: thread,
            referenceTo: 'thread',
            type: 'thread-assign'
        };
        NotificationHelper.create(params, function () {
            PushNotificationHelper.getData(thread.project, thread._id, thread.name, "This thread has assigned to you", thread.members, "thread", function() {
                return next();
            });
        });
    }
});

EventBus.onSeries('Thread.Updated', function(thread, next) {
  if (thread.members.length > 0 || thread.oldUsers.length > 0) {
    async.waterfall([
      function(callback) {
        var toUsers = [];
        thread.members.forEach(function(user) {
          if (_.findIndex(thread.oldUsers,user) == -1)  {
            toUsers.push(user)
          }
        });
        async.each(toUsers,function(toUser,callback) {
          var params = {
            owners : thread.members,
            fromUser : thread.editUser,
            element : thread,
            toUser : toUser,
            referenceTo : 'thread',
            type : 'thread-assign'
          };
          NotificationHelper.create(params,function() {
            callback();
          });
        },function() {
          callback();
        })
      },
      function (callback) {
        var toUsers = [];
        var owners = thread.members;
        thread.oldUsers.forEach(function(user) {
          if (_.findIndex(thread.members, user) == -1) {
            toUsers.push(user)
          }
        });
        owners = _.union(owners,toUsers)

        async.each(toUsers,function(toUser,callback) {
          var params = {
            owners : owners,
            fromUser : thread.editUser,
            element : thread,
            toUser : toUser,
            referenceTo : 'thread',
            type : 'thread-remove'
          };
          NotificationHelper.create(params,function() {
            callback();
          });
        },function() {
          callback();
        })
      }
    ],function() {
      return next();
    })
  } else {
    return next();
  }
});

EventBus.onSeries('Thread.NewMessage', function(thread, next) {
    var owners = thread.members;
    owners.push(thread.owner);
    var index = _.findIndex(owners,thread.message.user._id);
    owners.splice(index,1);
    var params = {
        owners : owners,
        fromUser : thread.message.user,
        element : thread,
        referenceTo : 'thread',
        type : 'thread-message'
    };
    NotificationHelper.create(params,function() {
        var latestMessage = _.last(thread.messages);
        PushNotificationHelper.getData(thread.project, thread._id, thread.name, latestMessage.text, thread.members, "thread", function() {
            return next();
        });
    });
});
