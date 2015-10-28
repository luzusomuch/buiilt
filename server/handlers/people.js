'use strict';

var _ = require('lodash');
var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var NotificationHelper = require('./../components/helpers/notification');
var config = require('./../config/environment');
var async = require('async');
var _ = require('lodash');
var mongoose = require('mongoose');

EventBus.onSeries('People.Updated', function(req, next) {
    if (req._modifiedPaths.indexOf('invitePeople') != -1) {
        if (req.newInviteeSignUpAlready && req.newInviteeSignUpAlready.length > 0) {
            var params = {
                owners: req.newInviteeSignUpAlready,
                fromUser: req.editUser._id,
                element: req,
                referenceTo: 'people',
                type: 'invite-people'
            }
            NotificationHelper.create(params, function(){
                next();
            });
        } else {
            return next();
        }
    } else {
        return next();
    }
});