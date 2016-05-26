'use strict';

var EventBus = require('./../components/EventBus');
var Notification = require('./../models/notification.model');
var Project = require('./../models/project.model');
var PushNotificationHelper = require('./../components/helpers/PushNotification');
var _ = require('lodash');
var async = require('async');


EventBus.onSeries('Notification.Inserted', function(notification, next) {
    setTimeout(function() {
        Notification.findById(notification._id)
        .populate("fromUser").exec(function(err, n) {
            if (err || !n) {return next();}
            if (!n.unread) {
                return next();
            } else {
                if (notification.type === "thread-message") {
                    var latestMessage = _.last(notification.element.messages);
                    PushNotificationHelper.getData(notification.element.project, notification.element._id, n.fromUser.name + ": " + latestMessage.text, notification.owner, "thread", function() {
                        return next();
                    });
                } else if (notification.type==="thread-assign") {
                    PushNotificationHelper.getData(notification.element.project, notification.element._id, n.fromUser.name + " assigned you to " + "\"" + notification.element.name + "\"", notification.owner, "thread", function() {
                        return next();
                    });
                } else if (notification.type==="task-assign") {
                    PushNotificationHelper.getData(notification.element.project, notification.element._id, n.fromUser.name + " assigned you to " + "\"" + notification.element.description + "\"",  notification.owner, "task", function() {
                        return next();
                    });
                } else if (notification.type ==="task-completed") {
                    PushNotificationHelper.getData(notification.element.project, notification.element._id, n.fromUser.name + " completed " +  notification.element.description, notification.owner, "task", function() {
                        return next();
                    });
                } else if (notification.type==="invite-to-project" || notification.type==="invite-to-tender") {
                    Project.findById(notification.element.project, function(err, p) {
                        if (err || !p) {return next();}
                        PushNotificationHelper.getData(notification.element.project, notification.element._id, n.fromUser.name + (notification.type==="invite-to-project") ? " invited you to join " : " invited you to tender for " + p.name, notification.owner, "project", function() {
                            return next();
                        });
                    });
                } else if (notification.type==="document-upload-reversion" || notification.type==="file-upload-reversion") {
                    PushNotificationHelper.getData(notification.element.project, notification.element._id, n.fromUser.name + " uploaded a revision of " +  notification.element.name, notification.owner, notification.element.element.type, function() {
                        return next();
                    });
                } else {
                    return next();
                }
            }
        });
    }, 10000);
});