'use strict';

var _ = require('lodash');
var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var Notification = require('./../models/notification.model');
var NotificationHelper = require('./../components/helpers/notification');
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
  if (thread.users.length > 0) {
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
            type : 'thread-add'
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
        thread.oldUsers.forEach(function(user) {
          if (_.findIndex(thread.users, user) == -1) {
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
  var params = {
    owners : thread.users,
    fromUser : thread.message.user,
    element : thread,
    referenceTo : 'thread',
    type : 'thread-message'
  };
  NotificationHelper.create(params,function() {
    return next();
  });
});
