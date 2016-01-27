'use strict';

var EventBus = require('./../../components/EventBus');
var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var Team = require('./../../models/team.model');
var Mailer = require('./../../components/Mailer');
var PackageInvite = require('./../../models/packageInvite.model');
var People = require('./../../models/people.model');
var _ = require('lodash');
var async = require('async');


EventBus.onSeries('File.Inserted', function(request, next) {
    async.parallel({
        project: function(cb) {
            Project.findById(request.project, cb);
        }, 
        editUser: function(cb) {
            User.findById(request.owner, cb);
        },
        team: function(cb) {
            Team.findOne({$or:[{leader: request.owner}, {member: request.owner}]}, cb);
        }
    }, function(err, result) {
        if (err) {return next();}
        if (request.element.type === "file") {
            async.each(request.notMembers, function(member, cb) {
                packageInvite.findOne({to: member}, function(err, packageInvite) {
                    if (err || !packageInvite) {cb();}
                    else {
                        Mailer.sendMail('upload-file-to-non-user.html', from, member, {
                            team: result.team.toJSON(),
                            inviter: result.editUser.toJSON(),
                            invitee: member,
                            project: result.project.toJSON(),
                            request: request.toJSON(),
                            type: "file",
                            link : config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                            subject: req.editUser.name + ' has uploaded for you a file ' + request.name
                        },function(err){console.log(err);
                            return cb();
                        });
                    }
                });
            }, function() {
                return next();
            });
        } else if (request.element.type === "document") {
            var roles = ["builders", "clients", "architects", "subcontractors", "consultants"];
            People.findOne({project: request.project}, function(err, people) {
                if (err || !people) {return next();}
                async.each(roles, function(role, cb) {
                    async.each(people[role], function(tender, cb) {
                        if (tender.hasSelect) {
                            if (tender.tenderers[0].email) {
                                packageInvite.findOne({to: tender.tenderers[0].email}, function(err, packageInvite) {
                                    if (err || !packageInvite) {cb();}
                                    else {
                                        Mailer.sendMail('upload-file-to-non-user.html', from, packageInvite.to, {
                                            team: result.team.toJSON(),
                                            inviter: result.editUser.toJSON(),
                                            invitee: packageInvite.to,
                                            project: result.project.toJSON(),
                                            request: request.toJSON(),
                                            type: "document",
                                            link : config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                                            subject: req.editUser.name + ' has uploaded for you a document ' + request.name
                                        },function(err){console.log(err);
                                            cb();
                                        });
                                    }
                                });
                            } else
                                cb();
                        } else {
                            cb();
                        }
                    }, function(){
                        cb();
                    });
                }, function() {
                    return next();
                });
            });
        } else {
            return next();
        }
    });
});

EventBus.onSeries('File.Updated', function(request, next) {
    if (request.editType === "uploadReversion") {
        if (request.element.type === "document") {
            async.parallel({
                project: function(cb) {
                    Project.findById(request.project, cb);
                }, 
                editUser: function(cb) {
                    User.findById(request.owner, cb);
                },
                team: function(cb) {
                    Team.findOne({$or:[{leader: request.owner}, {member: request.owner}]}, cb);
                }
            }, function(err, result) { 
                if (err) {return next();}
                var roles = ["builders", "clients", "architects", "subcontractors", "consultants"];
                People.findOne({project: request.project}, function(err, people) {
                    if (err || !people) {return next();}
                    async.each(roles, function(role, cb) {
                        async.each(people[role], function(tender, cb) {
                            if (tender.hasSelect) {
                                if (tender.tenderers[0].email) {
                                    packageInvite.findOne({to: tender.tenderers[0].email}, function(err, packageInvite) {
                                        if (err || !packageInvite) {cb();}
                                        else {
                                            Mailer.sendMail('upload-file-to-non-user.html', from, packageInvite.to, {
                                                team: result.team.toJSON(),
                                                inviter: result.editUser.toJSON(),
                                                invitee: packageInvite.to,
                                                project: result.project.toJSON(),
                                                request: request.toJSON(),
                                                type: "document reversion",
                                                link : config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                                                subject: req.editUser.name + ' has uploaded for you a document ' + request.name
                                            },function(err){console.log(err);
                                                cb();
                                            });
                                        }
                                    });
                                } else
                                    cb();
                            } else 
                                cb();
                        }, function(){
                            cb();
                        });
                    }, function() {
                        return next();
                    });
                });
            });
        } else if (request.element.type === "file") {
            async.each(request.notMembers, function(member, cb) {
                packageInvite.findOne({to: member}, function(err, packageInvite) {
                    if (err || !packageInvite) {cb();}
                    else {
                        Mailer.sendMail('upload-file-to-non-user.html', from, member, {
                            team: result.team.toJSON(),
                            inviter: result.editUser.toJSON(),
                            invitee: member,
                            project: result.project.toJSON(),
                            request: request.toJSON(),
                            type: "file reversion",
                            link : config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                            subject: req.editUser.name + ' has uploaded for you a file ' + request.name
                        },function(err){console.log(err);
                            cb();
                        });
                    }
                });
            }, function() {
                return next();
            });
        } else {
            return next();
        }
    } else {
        return next();
    }
});