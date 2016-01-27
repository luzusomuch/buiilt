'use strict';

var _ = require('lodash');
var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var NotificationHelper = require('./../components/helpers/notification');
var PushNotificationHelper = require('./../components/helpers/PushNotification');
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
                PushNotificationHelper.getData(req.project,req._id,'People package', req.editUser.name, req.newInviteeSignUpAlready, 'invite-people', function() {
                    return next();
                });
            });
        } else {
            return next();
        }
    } else if (req._modifiedPaths.indexOf('selectWinnerTender') != -1) {
        if (req.winnerTender.length > 0) {
            var params = {
                owners: req.winnerTender,
                fromUser: req.editUser._id,
                element: req,
                referenceTo: 'people',
                type: 'winner-tender'
            };
            NotificationHelper.create(params, function(){
                next();
            });
        }
        if (req.loserTender.length > 0) {
            var params = {
                owners: req.loserTender,
                fromUser: req.editUser._id,
                element: req,
                referenceTo: 'people',
                type: 'loser-tender'
            };
            NotificationHelper.create(params, function(){
                next();
            });
        }
        else {
            return next();
        }
    } else {
        return next();
    }
});