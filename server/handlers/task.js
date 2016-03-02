'use strict';

var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var Notification = require('./../models/notification.model');
var NotificationHelper = require('./../components/helpers/notification');
var config = require('./../config/environment');
var async = require('async');
var _ = require('lodash');
var PushNotificationHelper = require('./../components/helpers/PushNotification');

EventBus.onSeries('Task.Inserted', function(task, next){
    if (task.members.length > 0) {
        if (_.indexOf(task.members, task.editUser._id) === -1) {
            task.members.push(task.editUser._id);
        }
        var params = {
            owners : task.members,
            fromUser : task.owner,
            element : task,
            referenceTo : 'task',
            type : 'task-assign'
        };
        NotificationHelper.create(params, function() {
            setTimeout(function() {
                var notReadMembers = [];
                async.each(task.members, function(member, cb) {
                    Notification.find({unread: true, owner: member._id, type: "task-assign"}, function(err, notifications) {
                        if (err) {cb(err);}
                        _.each(notifications, function(n) {
                            if (task._id.toString()===n.element._id.toString()) {
                                notReadMembers.push(member._id);
                            }
                        });
                        cb(null);
                    });
                }, function(err) {
                    if (err) {console.log(err);return next()}
                    notReadMembers = _.uniq(notReadMembers);
                    PushNotificationHelper.getData(task.project, task._id, task.description, 'has assigned to you', notReadMembers, 'task', function() {
                        return next();
                    });
                });
            }, 60000);
        });
    } else {
        return next();
    }
});

EventBus.onSeries('Task.Updated', function(task, next){
    if (task._modifiedPaths.indexOf('completed') != -1) {
        var owners = task.members.slice();
        if (task.members.indexOf(task.owner) == -1) {
            owners.push(task.owner);
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
            if (task.completed) {
                setTimeout(function() {
                    var notReadMembers = [];
                    async.each(task.members, function(member, cb) {
                        Notification.find({unread: true, owner: member._id, type: "task-completed"}, function(err, notifications) {
                            if (err) {cb(err);}
                            _.each(notifications, function(n) {
                                if (task._id.toString()===n.element._id.toString()) {
                                    notReadMembers.push(member._id);
                                }
                            });
                            cb(null);
                        });
                    }, function(err) {
                        if (err) {console.log(err);return next()}
                        notReadMembers = _.uniq(notReadMembers);
                        PushNotificationHelper.getData(task.project, task._id, task.description, 'This task has marked as completed', notReadMembers, 'task', function() {
                            return next();
                        });
                    });
                }, 60000);
            } else {
                return next();
            }
        });
    } else if (task._modifiedPaths.indexOf('assignees') != -1) {
        async.parallel([
            function(callback) {
                if (task._oldAssignees.length > 0) {
                    var owners = task.members.slice();
                    async.each(task._oldAssignees, function (assignee, cb) {
                        if (task.members.indexOf(assignee) == -1) {
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
                        owners : task.members,
                        fromUser : task.owner,
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
                    async.each(task.members, function(assignee, cb) {
                        if (task._oldAssignees.indexOf(assignee.toString()) != -1) {
                            return cb();
                        } else {
                            var params = {
                                owners : [assignee],
                                fromUser : task.editUser,
                                toUser: assignee,
                                element : task,
                                referenceTo: 'task',
                                type: 'task-assign'
                            };
                            NotificationHelper.create(params, cb);
                        }
                    }, callback);
                }else{
                    return callback();
                }
            }
        ],function() {
            return next();
        });
    } else if (task._modifiedPaths.indexOf("insertNote") !== -1) {
        var latestActivity = _.last(task.activities);
        if (latestActivity.type==="insert-note") {
            var owners = task.members;
            owners.push(task.owner);
            _.remove(owners, task.editUser._id);
            var params = {
                owners : owners,
                fromUser : task.editUser._id,
                element : task,
                referenceTo : 'task',
                type : 'task-new-note'
            };
            NotificationHelper.create(params, function() {
                return next();
            });
        } else {
            return next();
        }
    } else {
        return next();
    }
});