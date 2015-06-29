'use strict';

var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var Project = require('./../models/project.model');
var ContractorPackage = require('./../models/contractorPackage.model');
var Team = require('./../models/team.model');
var Notification = require('./../models/notification.model');
var NotificationHelper = require('./../components/helpers/notification');
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
                        type: 'sendQuote'
                    });
                    notification.save();
                });
            }
        });
    }
    else if (request._modifiedPaths.indexOf('inviteContractor') != -1){
        Team.findById(request.owner, function(err, team){
            if (err) {return next();}
            else {
                _.each(team.leader, function(leader){
                    var notification = new Notification({
                        owner: leader,
                        fromUser: request.ownerUser,
                        toUser: leader,
                        element: request,
                        referenceTo: 'ContractorPackage',
                        type: 'invite'
                    });
                    notification.save();
                });
            }
        });
        _.each(request.newInvitation, function(invite){
            if (invite._id) {
                Team.findById(invite._id, function(err, team){
                    if (err) {return next();}
                    if (!team) {return next();}
                    else {
                        _.each(team.leader, function(leader){
                            var notification = new Notification({
                                owner: leader,
                                fromUser: request.ownerUser,
                                toUser: leader,
                                element: request,
                                referenceTo: 'ContractorPackage',
                                type: 'invitation'
                            });
                            notification.save();
                        });
                    }
                });
            }
            else {
                return next();
            }
        });
    }
    else if (request._modifiedPaths.indexOf('sendAddendum') != -1) {
        _.each(request.to, function(toContractor) {
            Team.findById(toContractor, function(err, team){
                if (err) {return next();}
                else {
                    _.each(team.leader, function(leader) {
                        var notification = new Notification({
                            owner: leader,
                            fromUser: request.editUser,
                            toUser: leader,
                            element: request,
                            referenceTo: 'ContractorPackage',
                            type: 'sendAddendum'
                        });
                        notification.save();
                    });
                }
            })
        });
    }
    else if(request._modifiedPaths.indexOf('editAddendum') != -1) {
        _.each(request.to, function(toContractor){
            if (toContractor._id) {
                Team.findById(toContractor, function(err, team){
                    if (err) {return next();}
                    if (!team) {return next();}
                    else {
                        _.each(team.leader, function(leader) {
                            var notification = new Notification({
                                owner: leader,
                                fromUser: request.editUser,
                                toUser: leader,
                                element: request,
                                referenceTo: 'ContractorPackage',
                                type: 'editAddendum'
                            });
                            notification.save();
                        });
                    }
                });
            }
            else {
                return next();
            }
        });
    }
    else if(request._modifiedPaths.indexOf('sendMessage') != -1) {
        Team.findById(request.editUser, function(err,team){
            if (err) {return next();}
            if (!team) {return next();}
            else {
                var params = {
                    owners : team.leader,
                    fromUser : request.ownerUser,
                    element : request,
                    referenceTo : 'ContractorPackage',
                    type : 'sendMessage'
                };
                NotificationHelper.create(params,function(err) {
                  if (err) {
                    console.log(err);
                  }
                  next();
                });
            }
        });
    }
    else if(request._modifiedPaths.indexOf('sendMessageToBuilder') != -1) {
        Team.findById(request.owner, function(err,team){
            if (err) {return next();}
            if (!team) {return next();}
            else {
                var params = {
                    owners : team.leader,
                    fromUser : request.editUser,
                    element : request,
                    referenceTo : 'ContractorPackage',
                    type : 'sendMessageToBuilder'
                };
                NotificationHelper.create(params,function(err) {
                  if (err) {
                    console.log(err);
                  }
                  next();
                });
            }
        });
    }
});