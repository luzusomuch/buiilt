'use strict';

var EventBus = require('./../components/EventBus');
var Notification = require('./../models/notification.model');
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
                    PushNotificationHelper.getData(notification.element.project, notification.element._id, notification.element.name, latestMessage.text, notification.owner, "thread", function() {
                        return next();
                    });
                } else if (notification.type==="thread-assign") {
                    PushNotificationHelper.getData(notification.element.project, notification.element._id, notification.element.name, "has assigned to you by " + notification.fromUser.name, notification.owner, "thread", function() {
                        return next();
                    });
                } else if (notification.type==="task-assign") {
                    PushNotificationHelper.getData(notification.element.project, notification.element._id, notification.element.description, "has assigned to you by " + notification.fromUser.name, notification.owner, "task", function() {
                        return next();
                    });
                } else if (notification.type ==="task-completed") {
                    PushNotificationHelper.getData(notification.element.project, notification.element._id, notification.element.description, notification.fromUser.name + " has marked this task as completed", notification.owner, "task", function() {
                        return next();
                    });
                } else if (notification.type==="invite-to-project") {
                    PushNotificationHelper.getData(notification.element.project, notification.element._id, "", notification.fromUser.name + " has invited you to join their project", notification.owner, "project", function() {
                        return next();
                    });
                } else {
                    return next();
                }
            }
        });
    }, 60000);
});