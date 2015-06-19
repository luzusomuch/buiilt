/**
 * Broadcast updates to client when the model changes
 */
var _ = require('lodash');
'use strict';

var Mailer = require('./../../components/Mailer');
var Team = require('./../../models/team.model');
var EventBus = require('./../../components/EventBus');
var User = require('./../../models/user.model');
var config = require('./../../config/environment');
var async = require('async');
var _ = require('lodash');

EventBus.onSeries('Project.Inserted', function(request, next){
    console.log(request);
    if (request.type === 'FromHomeOwnerToBuilder') {
        if (!request.builder._id) {
            Mailer.sendMail('invite-home-builder-send-quote-no-account.html', request.builder.email, {
                project: request,
                registryLink: config.baseUrl + 'signup',
                link: config.baseUrl + 'builder-packages/' + request._id + '/send-quote',
                subject: 'Invite home builder send quote for ' + request.name
            },function(err){
                return next();
            });
        }
        else if(request.builder._id) {
            Team.findOne({$or:[{leader: request.builder._id}, {'member._id': request.builder._id}]}, function(err, team) {
                if (err) {return res.send(500,err);}
                if (!team) {return res.send(404,err);}
                else {
                    _.each(team.leader, function(leader) {
                        User.findById(leader, function(err, user) {
                            if (err) {console.log(err); return next();}
                            if (!user) {console.log(err); return next();}
                            else {
                                Mailer.sendMail('invite-home-builder.html', user.email, {
                                    project: request,
                                    link: config.baseUrl + 'builder-packages/' + request._id + '/send-quote',
                                    subject: 'Invite home builder send quote for ' + request.name
                                },function(err){
                                    return next();
                                });
                            }
                        });
                    })
                }
            });
        }
    }
    else if(request.type === 'FromBuilderToHomeOwner') {
        if (!request.user._id) {
            Mailer.sendMail('invite-home-owner-has-no-account.html', request.user.email, {
                project: request,
                link: config.baseUrl + 'signup',
                subject: 'Invite home builder for ' + request.name
            },function(err){
                return next();
            });
        }
        else if(request.user._id) {
            Team.findOne({$or:[{leader: request.user._id}, {'member._id': request.user._id}]}, function(err, team) {
                if (err) {return res.send(500,err);}
                if (!team) {return res.send(404,err);}
                else {
                    _.each(team.leader, function(leader) {
                        User.findById(leader, function(err, user) {
                            if (err) {console.log(err); return next();}
                            if (!user) {console.log(err); return next();}
                            else {
                                Mailer.sendMail('invite-home-owner.html', user.email, {
                                    project: request,
                                    link: config.baseUrl + request._id + '/dashboard',
                                    subject: 'Invite home builder for ' + request.name
                                },function(err){
                                    return next();
                                });
                            }
                        });
                    });
                }
            });
            
        }
    }
});