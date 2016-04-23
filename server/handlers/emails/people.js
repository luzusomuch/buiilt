/**
 * Broadcast updates to client when the model changes
 */
'use strict';

var Mailer = require('./../../components/Mailer');
var Team = require('./../../models/team.model');
var Project = require('./../../models/project.model');
var EventBus = require('./../../components/EventBus');
var User = require('./../../models/user.model');
var PackageInvite = require('./../../models/packageInvite.model');
var config = require('./../../config/environment');
var async = require('async');
var _ = require('lodash');

EventBus.onSeries('People.Updated', function(req, next){
    if (req._modifiedPaths.indexOf('updateDistributeStatus') != -1) {
        var from = req.editUser.name + "<"+req.editUser.email+">";
        var currentTender = req.updatedTender;
        async.parallel({
            project: function (cb) {
                Project.findById(req.project, cb);
            },
            team: function (cb) {
                Team.findOne({$or:[{leader: req.editUser._id}, {member: req.editUser._id}]}, cb);
            }
        }, function(err, result) {
            if (err) {return next();}
            async.each(currentTender.tenderers, function(tenderer, cb){
                if (tenderer._id) {
                    User.findById(tenderer._id, function(err, user) {
                        if (err || !user) {cb();}
                        else {
                            Mailer.sendMail('invite-user-to-tender.html', from, user.email, {
                                team: result.team.toJSON(),
                                project: result.project.toJSON(),
                                inviter: req.editUser.toJSON(),
                                invitee: user.toJSON(),
                                link : config.baseUrl + 'projects/open',
                                subject: req.editUser.name + ' has invited you to project ' + result.project.name
                            },function(err){
                               cb();
                            });
                        }
                    });
                } else {
                    var packageInvite = new PackageInvite({
                        owner: req.editUser._id,
                        project: req.project,
                        package: req._id,
                        inviteType : req.newInviteType,
                        to: tenderer.email,
                        user: req.editUser._id
                    });
                    packageInvite.save(function(err,saved){
                        if (err) {cb(err);}
                        Mailer.sendMail('invite-non-user-to-tender.html', from, saved.to, {
                            team: result.team.toJSON(),
                            inviter: req.editUser.toJSON(),
                            invitee: saved.to,
                            project: result.project.toJSON(),
                            link : config.baseUrl + 'signup?packageInviteToken=' + packageInvite._id,
                            subject: req.editUser.name + ' has invited you to project ' + result.project.name
                        },function(err){
                            cb();
                        });
                    });
                }
            }, function(){
                return next();
            });
        });
    } else if (req._modifiedPaths.indexOf("broadcast-message") !== -1) {
        var currentTender = req.updatedTender;
        var latestActivity = _.last(currentTender.inviterActivities);
        return next();
    } else if (req._modifiedPaths.indexOf("attach-addendum") !== -1) {
        var currentTender = req.updatedTender;
        var from = req.editUser.name + "<"+req.editUser.email+">";
        async.parallel({
            project: function (cb) {
                Project.findById(req.project, cb);
            },
            team: function (cb) {
                Team.findOne({$or:[{leader: req.editUser._id}, {member: req.editUser._id}]}, cb);
            }
        }, function(err, result) {
            if (err) {return next();}
            var latestActivity = _.last(currentTender.inviterActivities);
            async.each(currentTender.tenderers, function(tenderer, cb) {
                if (tenderer.email) {
                    PackageInvite.findOne({to: tenderer.email}, function(err, packageInvite) {
                        if (err || !packageInvite) {cb();}
                        else {
                            Mailer.sendMail('send-addendum-to-non-user.html', from, packageInvite.to, {
                                team: result.team.toJSON(),
                                inviter: req.editUser.toJSON(),
                                invitee: packageInvite.to,
                                project: result.project.toJSON(),
                                request: currentTender,
                                allowDownload: (latestActivity.element.link) ? true : false,
                                downloadLink: config.baseUrl + "api/peoples/"+req._id+"/"+packageInvite.inviteType+"/"+currentTender._id+"/"+latestActivity._id+"/"+packageInvite.to+"/download-via-email",
                                link : config.baseUrl + 'signup?packageInviteToken=' + packageInvite._id,
                                subject: req.editUser.name + ' has send you an addendum on ' + currentTender.tenderName
                            },function(err){
                                return cb();
                            });
                        }
                    });
                } else  
                    cb();
            }, function(){
                return next();
            });
        });
    } else if (req._modifiedPaths.indexOf("invitePeople") !== -1) {
        var currentTender = req.updatedTender;
        var from = req.editUser.name + "<"+req.editUser.email+">";
        async.parallel({
            project: function (cb) {
                Project.findById(req.project, cb);
            },
            team: function (cb) {
                Team.findOne({$or:[{leader: req.editUser._id}, {member: req.editUser._id}]}, cb);
            }
        }, function(err, result) {
            if (err) {return next();}
            if (currentTender && currentTender.hasSelect && !currentTender.tenderers[0]._id) {
                var packageInvite = new PackageInvite({
                    owner: req.editUser._id,
                    project: req.project,
                    package: req._id,
                    inviteType: req.newInviteType,
                    to: currentTender.tenderers[0].email,
                    user: req.editUser._id,
                    isSkipInTender: true
                });
                packageInvite.save(function(err) {
                    if (err) {return next();}
                    Mailer.sendMail('invite-non-user-to-project.html', from, packageInvite.to, {
                        team: result.team.toJSON(),
                        inviter: req.editUser.toJSON(),
                        invitee: currentTender.tenderers[0].name,
                        project: result.project.toJSON(),
                        link : config.baseUrl + 'signup?packageInviteToken=' + packageInvite._id,
                        subject: req.editUser.name + ' has invited you to project ' + result.project.name
                    },function(err){
                        return next();
                    });
                }); 
            } else if (currentTender && currentTender.hasSelect && currentTender.tenderers[0]._id) {
                User.findById(currentTender.tenderers[0]._id, function(err, user) {
                    if (err || !user) {return next();}
                    Mailer.sendMail('invite-user-to-project.html', from, user.email, {
                        team: result.team.toJSON(),
                        inviter: req.editUser.toJSON(),
                        invitee: user,
                        project: result.project.toJSON(),
                        link : config.baseUrl + 'project/'+result.project._id+'/overview',
                        subject: req.editUser.name + ' has invited you to project ' + result.project.name
                    },function(err){
                        return next();
                    });
                });
            } else {
                return next();
            }
        });
    } else {
        return next();
    }
});
