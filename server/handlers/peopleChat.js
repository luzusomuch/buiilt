'use strict';

var _ = require('lodash');
var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var Notification = require('./../models/notification.model');
var NotificationHelper = require('./../components/helpers/notification');
var config = require('./../config/environment');
var async = require('async');
var _ = require('lodash');
var mongoose = require('mongoose');

EventBus.onSeries('PeopleChat.Updated', function(req, next) {
    _.remove(req.members, req.editUser._id);
    var params = {
        owners: req.members,
        fromUser: req.editUser._id,
        element: req,
        referenceTo: 'people-chat',
        type: 'chat'
    };
    NotificationHelper.create(params, function() {
        next();
    });
});