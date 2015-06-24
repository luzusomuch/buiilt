var _ = require('lodash');
'use strict';

var Mailer = require('./../../components/Mailer');
var EventBus = require('./../../components/EventBus');
var Project = require('./../../models/project.model');
var Team = require('./../../models/team.model');
var User = require('./../../models/user.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var PackageInvite = require('./../../models/packageInvite.model');
var config = require('./../../config/environment');
var async = require('async');

EventBus.onSeries('BuilderPackage.Inserted', function(request, next) {
    Project.findById(request.project).populate('owner').exec(function(err, project){
        if (err) {return next();}
        else {
            if (project.type === 'FromHomeOwnerToBuilder') {
                if (!project.builder._id) {
                    PackageInvite.find({package: request._id}, function(err, packageInvites) {
                        if (err) {return next();}
                        if (!packageInvites) {return next();}
                        else {
                            _.each(packageInvites, function(packageInvite){
                                Mailer.sendMail('invite-home-builder-send-quote-no-account.html', packageInvite.to, {
                                    project: project,
                                    registryLink: config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                                    link: config.baseUrl + 'builder-packages/' + project._id + '/send-quote',
                                    subject: 'Invite home builder send quote for ' + project.name
                                },function(err){
                                    console.log(err);
                                    return next();
                                });
                            });
                        }
                    });
                    
                }
                else if(project.builder._id){
                    console.log('-----------------');
                    console.log(project.builder._id);
                    Team.findById(project.builder._id, function(err, team) {
                        if (err) {return next();}
                        if (!team) {return next();}
                        else {
                            console.log(team);
                            _.each(team.leader, function(leader) {
                                User.findById(leader, function(err, user) {
                                    if (err) {console.log(err); return next();}
                                    if (!user) {console.log(err); return next();}
                                    else {
                                        console.log(user);
                                        Mailer.sendMail('invite-home-builder.html', user.email, {
                                            project: project,
                                            link: config.baseUrl + project._id + '/dashboard',
                                            subject: 'Invite home builder send quote for ' + project.name
                                        },function(err){
                                            console.log(err);
                                            return next();
                                        });
                                    }
                                });
                            })
                        }
                    });
                }
            }
            else if(project.type === 'FromBuilderToHomeOwner') {
                if (!project.user._id) {
                    PackageInvite.find({package: request._id}, function(err, packageInvites) {
                        if (err) {return next();}
                        if (!packageInvites) {return next();}
                        else {
                            _.each(packageInvites, function(packageInvite){
                                Mailer.sendMail('invite-home-owner-has-no-account.html', packageInvite.to, {
                                    project: project,
                                    link: config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                                    subject: 'Invite home owner for ' + project.name
                                },function(err){
                                    return next();
                                });
                            });
                        }
                    });
                }
                else if(project.user._id) {
                    Team.findById(project.user._id, function(err, team) {
                        if (err) {return next();}
                        if (!team) {return next();}
                        else {
                            _.each(team.leader, function(leader) {
                                User.findById(leader, function(err, user) {
                                    if (err) {console.log(err); return next();}
                                    if (!user) {console.log(err); return next();}
                                    else {
                                        Mailer.sendMail('invite-home-owner.html', user.email, {
                                            project: project,
                                            link: config.baseUrl + request._id + '/dashboard',
                                            subject: 'Invite home owner for ' + request.name
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
            else {
                return next();
            }
        }
    });
});