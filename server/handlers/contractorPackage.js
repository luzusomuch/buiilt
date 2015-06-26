'use strict';

var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var Project = require('./../models/project.model');
var ContractorPackage = require('./../models/contractorPackage.model');
var Team = require('./../models/team.model');
var Notification = require('./../models/notification.model');
var _ = require('lodash');
var async = require('async');

EventBus.onSeries('ContractorPackage.Inserted', function(request, next) {
    _.each(request.to, function(toSupplier){
        User.findOne({email: toSupplier.email}, function(err, user){
            if (err) {return next();}
            if (!user) {return next();}
            else {
                var notification = new Notification({
                    owner: user._id,
                    fromUser: request._ownerUser,
                    toUser: user._id,
                    element: request,
                    referenceTo: 'ContractorPackage',
                    type: 'CreateContractorPackage'
                });
                notification.save();
            }
        });
    });
});

EventBus.onSeries('ContractorPackage.Updated', function(request, next) {
    console.log(request._modifiedPaths);
    if (request._modifiedPaths.indexOf('sendQuote') != -1) {
        Team.findById(request.owner, function(err, team) {
            if (err) {return next();}
            else {
                _.each(team.leader, function(leader) {
                    var notification = new Notification({
                        owner: leader,
                        fromUser: request._editUser,
                        toUser: leader,
                        element: {package: request, quote: request._quote},
                        referenceTo: 'SendQuote',
                        type: 'SendQuoteToContractorPackage'
                    });
                    notification.save();
                });
            }
        });
    }
    else if (request._modifiedPaths.indexOf('inviteContractor') != -1){
        _.each(request.newInvitation, function(invitation) {
            var notification = new Notification({
                
            });
        });
    }
});