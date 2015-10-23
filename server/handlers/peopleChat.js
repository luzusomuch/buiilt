'use strict';

var _ = require('lodash');
var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var Notification = require('./../models/notification.model');
var config = require('./../config/environment');
var async = require('async');
var _ = require('lodash');
var mongoose = require('mongoose');

EventBus.onSeries('PeopleChat.Updated', function(req, next) {
    var owners = [];
    _.each(req.messages, function(message) {
        owners.push(message.user.toString());
    });
    // _.remove(owners, req.editUser._id.toString());
    var filteredOwners = _.uniq(owners);
    var newOwners = [];
    _.each(filteredOwners, function(owner){
        newOwners.push(mongoose.Types.ObjectId(owner));
    });
    _.remove(newOwners, req.editUser._id);
    async.each(newOwners, function(owner) {
        var notification = new Notification({
            owner: owner,
            fromUser: req.editUser._id,
            toUser: owner,
            element: req,
            referenceTo: 'people-chat',
            type: 'chat'
        });
        notification.save(function(err){
            if (err) {next();}
            next();
        });
    }, function(){
        return next();
    });
});