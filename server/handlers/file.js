'use strict';

var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var Project = require('./../models/project.model');
var People = require('./../models/people.model');
var Notification = require('./../models/notification.model');
var NotificationHelper = require('./../components/helpers/notification');
var PushNotificationHelper = require('./../components/helpers/PushNotification');
var _ = require('lodash');
var async = require('async');


EventBus.onSeries('File.Inserted', function(file, next) {
    if (file.element.type === "file") {
        if (file.members.length > 0) {
            var params = {
                owners : file.members,
                fromUser : file.owner,
                element : file,
                referenceTo : 'file',
                type : 'file-assign'
            };
            NotificationHelper.create(params, function() {
                setTimeout(function() {
                    var notReadMembers = [];
                    async.each(file.members, function(member, cb) {
                        Notification.find({unread: true, owner: member, type: "file-assign"}, function(err, notifications) {
                            if (err) {cb(err);}
                            _.each(notifications, function(n) {
                                if (file._id.toString()===n.element._id.toString()) {
                                    notReadMembers.push(member);
                                }
                            });
                            cb(null);
                        });
                    }, function(err) {
                        if (err) {console.log(err);return next()}
                        notReadMembers = _.uniq(notReadMembers);
                        PushNotificationHelper.getData(file.project, file._id, file.name, "This file has assigned to you", notReadMembers, "file", function() {
                            return next();
                        });
                    });
                }, 60000);
            });
        } else
            return next();
    } else {
        return next();
    }
});

EventBus.onSeries('File.Updated', function(file, next) {
    if (file.editType === "uploadReversion") {
        if (file.element.type === "document") {
            var latestHistory = _.last(file.fileHistory);
            async.each(latestHistory.members, function(member, callback) {
                if (member._id) {
                    var params = {
                        owners : [member._id],
                        fromUser : file.editUser._id,
                        element : file,
                        referenceTo : 'document',
                        type : 'document-upload-reversion'
                    };
                    NotificationHelper.create(params, callback);
                } else {
                    callback();
                }
            }, function() {
                setTimeout(function() {
                    var notReadMembers = [];
                    var latestActivity = _.last(file.activities);
                    async.each(file.members, function(member, cb) {
                        Notification.find({unread: true, owner: member._id, type: "document-upload-reversion"}, function(err, notifications) {
                            if (err) {cb(err);}
                            _.each(notifications, function(n) {
                                var latestNotificationActivity = _.last(n.element.activities);
                                if (latestActivity._id.toString()===latestNotificationActivity._id.toString()) {
                                    notReadMembers.push(member._id);
                                }
                            });
                            cb(null);
                        });
                    }, function(err) {
                        if (err) {console.log(err);return next()}
                        notReadMembers = _.uniq(notReadMembers);
                        PushNotificationHelper.getData(file.project, file._id, file.name, "This document has uploaded new version", notReadMembers, "file", function() {
                            return next();
                        });
                    });
                }, 60000);
            });
        } else if (file.element.type === "file" || file.element.type === "tender") {
            if (file.members.length > 0) {
                var params = {
                    owners : file.members,
                    fromUser : file.editUser._id,
                    element : file,
                    referenceTo : file.element.type,
                    type : file.element.type+'-upload-reversion'
                };
                NotificationHelper.create(params, function() {
                    if (file.element.type==="file") {
                        setTimeout(function() {
                            var notReadMembers = [];
                            var latestActivity = _.last(file.activities);
                            async.each(file.members, function(member, cb) {
                                Notification.find({unread: true, owner: member._id, type: "file-upload-reversion"}, function(err, notifications) {
                                    if (err) {cb(err);}
                                    _.each(notifications, function(n) {
                                        var latestNotificationActivity = _.last(n.element.activities);
                                        if (latestActivity._id.toString()===latestNotificationActivity._id.toString()) {
                                            notReadMembers.push(member._id);
                                        }
                                    });
                                    cb(null);
                                });
                            }, function(err) {
                                if (err) {console.log(err);return next()}
                                notReadMembers = _.uniq(notReadMembers);
                                PushNotificationHelper.getData(file.project, file._id, file.name, "This file has uploaded new version", notReadMembers, "file", function() {
                                    return next();
                                });
                            });
                        }, 60000);
                    } else {
                        return next();
                    }
                });
            } else
                return next();
        } else {
            return next();
        }
    } else if (file.editType==="sendAcknowledge") {
        if (file.element.type==="file" || file.element.type==="tender") {
            if (file.members.length > 0) {
                _.remove(file.members, file.editUser._id);
                var params = {
                    owners : file.members,
                    fromUser : file.editUser._id,
                    element : file,
                    referenceTo : file.element.type,
                    type : file.element.type+'-send-acknowledge'
                };
                NotificationHelper.create(params, function() {
                    return next();
                });
            } else
                return next();
        } else if (file.element.type==="document") {
            var params = {
                owners : [file.owner],
                fromUser : file.editUser._id,
                element : file,
                referenceTo : 'document',
                type : 'document-send-acknowledge'
            };
            NotificationHelper.create(params, function() {
                return next();
            });
        } else {
            return next();
        }
    } else if (file.editType==="insert-note") {
        var owners = file.members;
        owners.push(file.owner);
        _.remove(owners, file.editUser._id);
        var params = {
            owners : [owners],
            fromUser : file.editUser._id,
            element : file,
            referenceTo : 'file',
            type : 'file-new-note'
        };
        NotificationHelper.create(params, function() {
            return next();
        });
    } else {
        return next();
    }
});