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

EventBus.onSeries('Board.Inserted', function(board, next) {
    if (board.invitees[0]._id) {
        var owners = [];
        owners.push(board.invitees[0]._id);
        var params = {
            owners: owners,
            fromUser: board.owner,
            element: board,
            referenceTo: 'Board',
            type: 'NewBoard'
        };
        NotificationHelper.create(params, function() {
            next();
        });
    } else {
        return next();
    }
});

EventBus.onSeries('Board.Updated', function(board, next) {
    if (board._modifiedPaths.indexOf('invitePeople') != -1) {
        if (board.inviteUser) {
            var owners = [];
            owners.push(board.inviteUser);
            var params = {
                owners: owners,
                fromUser: board.owner,
                element: board,
                referenceTo: 'Board',
                type: 'InvitePeopleToBoard'
            };
            NotificationHelper.create(params, function() {
                next();
            });
        } else {
            return next();
        }
    } else if (board._modifiedPaths.indexOf('sendMessage') != -1) {
        var owners = [];
        _.each(board.messages, function(message) {
            owners.push(message.user.toString());
        });
        var filteredOwners = _.uniq(owners);
        var newOwners = [];
        _.each(filteredOwners, function(owner){
            newOwners.push(mongoose.Types.ObjectId(owner));
        });
        _.remove(newOwners, board.editUser._id);
        var params = {
            owners: newOwners,
            fromUser: board.editUser._id,
            element: board,
            referenceTo: 'board-chat',
            type: 'chat'
        };
        NotificationHelper.create(params, function() {
            next();
        });
    } else {
        return next();
    }
});