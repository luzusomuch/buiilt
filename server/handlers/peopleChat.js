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
var mongoose = require('mongoose');

EventBus.onSeries('PeopleChat.Updated', function(req, next) {
    _.remove(req.members, req.editUser._id);
    var newestMessage = _.last(req.messages);
    if (newestMessage.mentions) {
        if (newestMessage.mentions.length > 0) {
            var params = {
                owners: newestMessage.mentions,
                fromUser: req.editUser._id,
                element: req,
                referenceTo: 'people-chat',
                type: 'chat'
            };
            NotificationHelper.create(params, function() {
                next();
            });
            var data = _.last(req.messages);
            PushNotificationHelper.getData(req.project,req._id,'People package', data.text, data.mentions, 'people');
        } else {
            return next();
        }
    } else {
        return next();
    }
});