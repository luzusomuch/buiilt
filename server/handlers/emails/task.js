var Mailer = require('./../../components/Mailer');
var Team = require('./../../models/team.model');
var Project = require('./../../models/project.model');
var EventBus = require('./../../components/EventBus');
var User = require('./../../models/user.model');
var config = require('./../../config/environment');
var async = require('async');
var PackageInvite = require('./../../models/packageInvite.model');
var _ = require('lodash');

EventBus.onSeries('Task.Inserted', function(req, next){
    var from = req.editUser.name + "<"+req.editUser.email+">";
    async.parallel({
        project: function(cb) {
            Project.findById(req.project, cb);
        },
        team: function(cb) {
            Team.findOne({$or:[{leader: req.editUser._id}, {member: req.editUser._id}]}, cb);
        }
    }, function(err, result) {
        if (err) {return next();}
        async.each(req.members, function(member, cb) {
            if (member.email) {
                packageInvite.findOne({to: member.email}, function(err, packageInvite) {
                    if (err || !packageInvite) {cb();}
                    else {
                        Mailer.sendMail('assign-task-to-non-user.html', from, member.email, {
                            team: result.team.toJSON(),
                            inviter: req.editUser.toJSON(),
                            invitee: member.email,
                            project: result.project.toJSON(),
                            request: req.toJSON(),
                            link : config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                            subject: req.editUser.name + ' has assigned you a task ' + req.description
                        },function(err){console.log(err);
                            return cb();
                        });
                    }
                });
            } else {
                cb();
            }
        }, function() {
            return next();
        });
    });
});

EventBus.onSeries('Task.Updated', function(req, next){
    var from = req.editUser.name + "<"+req.editUser.email+">";
    if (req._modifiedPaths.indexOf('assignees') != -1) {
        async.parallel({
            project: function(cb) {
                Project.findById(req.project, cb);
            },
            team: function(cb) {
                Team.findOne({$or:[{leader: req.editUser._id}, {member: req.editUser._id}]}, cb);
            }
        }, function(err, result) {
            if (err) {return next();}
            async.each(req.members, function(member, cb) {
                if (member.email && !(_.find(req.oldAssignees,{ email : member.email}))) {
                    packageInvite.findOne({to: member.email}, function(err, packageInvite) {
                        if (err || !packageInvite) {cb();}
                        else {
                            Mailer.sendMail('assign-task-to-non-user.html', from, member.email, {
                                team: result.team.toJSON(),
                                inviter: req.editUser.toJSON(),
                                invitee: member.email,
                                request: req.toJSON(),
                                project: result.project.toJSON(),
                                link : config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                                subject: req.editUser.name + ' has assigned you a task ' + req.description
                            },function(err){console.log(err);
                                return cb();
                            });
                        }
                    });
                } else {
                    cb();
                }
            }, function() {
                return next();
            });
        });
    } else {
        return next();
    }
});