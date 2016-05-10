'use strict';

var _ = require('lodash');
var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var NotificationHelper = require('./../components/helpers/notification');
var config = require('./../config/environment');
var async = require('async');
var mongoose = require('mongoose');

EventBus.onSeries('Tender.Inserted', function(tender, next) {
    return next();
});

EventBus.onSeries('Tender.Updated', function(tender, next) {
    if (tender._modifiedPaths.indexOf('invite-tenderer') !== -1) {
        var owners = [];
        _.each(tender.newInvitees, function(invitee) {
            if (invitee._id) {
                owners.push(invitee._id);
            }
        });
        var params = {
            owners: owners,
            fromUser: tender.editUser._id,
            element: tender,
            referenceTo: 'tender',
            type: 'invite-to-tender'
        }
        NotificationHelper.create(params, function(){
            return next();
        });
    } else {
        return next();
    }
});