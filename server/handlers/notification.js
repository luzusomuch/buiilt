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
                    PushNotificationHelper.getData(notification.element.project, notification.element._id, n.fromUser.name + " to " + notification.element.name + ": " + latestMessage.text, notification.owner, "thread", function() {
                        return next();
                    });
                } else if (notification.type==="thread-assign") {
                    PushNotificationHelper.getData(notification.element.project, notification.element._id, n.fromUser.name + " has assigned you to the subject " + "\"" + notification.element.name + "\"", notification.owner, "thread", function() {
                        return next();
                    });
                } else if (notification.type==="task-assign") {
                    PushNotificationHelper.getData(notification.element.project, notification.element._id, n.fromUser.name + " has assigned you to the task " + "\"" + notification.element.description + "\"",  notification.owner, "task", function() {
                        return next();
                    });
                } else if (notification.type ==="task-completed") {
                    PushNotificationHelper.getData(notification.element.project, notification.element._id, n.fromUser.name + " has completed the task " +  notification.element.description, notification.owner, "task", function() {
                        return next();
                    });
                } else if (notification.type==="invite-to-project" || notification.type==="invite-to-tender") {
                    Project.findById(notification.element.project, function(err, p) {
                        if (err || !p) {return next();}
                        PushNotificationHelper.getData(notification.element.project, notification.element._id, n.fromUser.name + (notification.type==="invite-to-project") ? " has invited you to join their project " : " has invited you to be tenderer for project " + p.name, notification.owner, "project", function() {
                            return next();
                        });
                    });
                } else {
                    return next();
                }
            }
        });
    }, 10000);
});