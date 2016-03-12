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
        var owners = _.clone(thread.members);
        _.remove(owners, thread.editUser._id);
        var params = {
            owners: owners,
            fromUser: thread.owner,
            element: thread,
            referenceTo: 'thread',
            type: 'thread-assign'
        };
        NotificationHelper.create(params, function () {
            return next();
        });
    }
});

EventBus.onSeries('Thread.Updated', function(thread, next) {
    if (thread._modifiedPaths.indexOf("archive") !== -1) {
        Notification.find({"element._id": thread._id, unread: true}, function(err, notifications) {
            if (err) {return next();}
            async.each(notifications, function(n, cb) {
                n.unread = false;
                n.save(cb);
            }, function() {
                return next();
            });
        });
    } else if (thread.members.length > 0 || thread.oldUsers.length > 0) {
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
                });
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
                });
            }
        ],function() {
            return next();
        });
    } else {
        return next();
    }
});

EventBus.onSeries('Thread.NewMessage', function(thread, next) {
    var owners = _.clone(thread.members);
    if (owners[0]._id) {
        var newOwners = [];
        _.each(owners, function(owner) {
            newOwners.push(owner._id);
        });
        owners = newOwners;
    }
    var uniqOwners = _.map(_.groupBy(owners,function(doc){
        return doc;
    }),function(grouped){
        return grouped[0];
    });
    _.remove(uniqOwners, thread.message.user._id);
    var params = {
        owners : uniqOwners,
        fromUser : thread.message.user,
        element : thread,
        referenceTo : 'thread',
        type : 'thread-message'
    };
    NotificationHelper.create(params,function() {
        return next();
    });
});
