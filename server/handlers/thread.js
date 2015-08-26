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
  if (thread.users.length > 0) {
    var params = {
      owners: thread.users,
      fromUser: thread.owner,
      element: thread,
      referenceTo: 'thread',
      type: 'thread-assign'
    };
    NotificationHelper.create(params, function () {
      return next();
    })
  }
});

EventBus.onSeries('Thread.Updated', function(thread, next) {
  if (thread.users.length > 0 || thread.oldUsers.length > 0) {
    async.waterfall([
      function(callback) {
        var toUsers = [];
        thread.users.forEach(function(user) {
          if (_.findIndex(thread.oldUsers,user) == -1)  {
            toUsers.push(user)
          }
        });
        async.each(toUsers,function(toUser,callback) {
          var params = {
            owners : thread.users,
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
        var owners = thread.users;
        thread.oldUsers.forEach(function(user) {
          if (_.findIndex(thread.users, user) == -1) {
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
  var owners = thread.users;
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
    return next();
  });
  var data = _.last(thread.messages);
  PushNotificationHelper.getData(thread._id,thread.name, data.text, thread.users, 'message');
});
