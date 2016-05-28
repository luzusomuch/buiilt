'use strict';

var Mailer = require('./../../components/Mailer');
var Team = require('./../../models/team.model');
var Project = require('./../../models/project.model');
var EventBus = require('./../../components/EventBus');
var User = require('./../../models/user.model');
var PackageInvite = require('./../../models/packageInvite.model');
var config = require('./../../config/environment');
var Client = require("twilio")(config.twilio.sid, config.twilio.token);
var async = require('async');
var _ = require('lodash');

EventBus.onSeries('Tender.Updated', function(tender, next){
    async.parallel({
        project: function (cb) {
            Project.findById(tender.project, cb);
        },
        team: function (cb) {
            Team.findOne({$or:[{leader: tender.editUser._id}, {member: tender.editUser._id}]}, cb);
        }
    }, function(err, result) {
        if (err) {return next();}   
        if (tender._modifiedPaths.indexOf('invite-tenderer') !== -1) {
            var from = tender.editUser.name + "<"+tender.editUser.email+">";
            if (tender.newInvitees && tender.newInvitees.length > 0) {
                async.each(tender.newInvitees, function(invitee, cb) {
                    if (!invitee._id) {
                        var packageInvite = new PackageInvite({
                            owner: tender.editUser._id,
                            project: tender.project,
                            package: tender._id,
                            inviteType : tender.type,
                            to: invitee.email,
                            user: tender.editUser._id
                        });
                        packageInvite.save(function(err) {
                            if (err) {cb(err);}
                            Mailer.sendMail('invite-non-user-to-tender.html', from, packageInvite.to, {
                                tender: tender.toJSON(),
                                team: result.team.toJSON(),
                                inviter: tender.editUser.toJSON(),
                                invitee: invitee,
                                project: result.project.toJSON(),
                                link : config.baseUrl + 'signup?packageInviteToken=' + packageInvite._id,
                                subject: tender.editUser.name + ' invited you to tender their project, ' + result.project.name
                            }, function() {
                                // Send SMS notification for inactive user
                                Client.sendMessage({
                                    to: invitee.phoneNumber,
                                    from: config.twilio.phoneNumber,
                                    body: tender.editUser.name + " invited you to tender their project. Sign Up with your mobile - http://buiilt.com.au/appPage"
                                }, function(err, success) {
                                    console.log(err);
                                    console.log(success);
                                    return next();
                                });
                            });
                        });
                    } else {
                        Mailer.sendMail('invite-user-to-tender.html', from, invitee.email, {
                            tender: tender.toJSON(),
                            team: result.team.toJSON(),
                            inviter: tender.editUser.toJSON(),
                            invitee: invitee,
                            project: result.project.toJSON(),
                            link : config.baseUrl + 'project/'+result.project._id+'/overview',
                            subject: tender.editUser.name + ' invited you to tender their project, ' + result.project.name
                        }, cb);
                    }
                }, function() {
                    return next();
                });
            } else {
                return next();
            }
        } else if (tender._modifiedPaths.indexOf("distribute-status") !== -1) {
            var from = tender.editUser.name + "<"+tender.editUser.email+">";
            async.each(tender.members, function(member, cb) {
                PackageInvite.findOne({project: tender.project, to: member.email}, function(err, p) {
                    if (err) {cb(err);}
                    if (!p) {
                        var packageInvite = new PackageInvite({
                            owner: tender.editUser._id,
                            project: tender.project,
                            package: tender._id,
                            inviteType : tender.type,
                            to: member.email,
                            user: tender.editUser._id
                        });
                        packageInvite.save(function(err) {
                            if (err) {cb(err);}
                            Mailer.sendMail('invite-non-user-to-tender.html', from, packageInvite.to, {
                                team: result.team.toJSON(),
                                inviter: tender.editUser.toJSON(),
                                invitee: member,
                                project: result.project.toJSON(),
                                link : config.baseUrl + 'signup?packageInviteToken=' + packageInvite._id,
                                subject: tender.editUser.name + ' has invited you to project ' + result.project.name
                            }, cb);
                        });
                    } else {
                        Mailer.sendMail('invite-non-user-to-tender.html', from, p.to, {
                            team: result.team.toJSON(),
                            inviter: tender.editUser.toJSON(),
                            invitee: member,
                            project: result.project.toJSON(),
                            link : config.baseUrl + 'signup?packageInviteToken=' + p._id,
                            subject: tender.editUser.name + ' has invited you to project ' + result.project.name
                        }, cb);
                    }
                });
            }, function() {return next();});
        } else {
            return next();
        }
    });
});