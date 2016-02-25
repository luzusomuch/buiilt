'use strict';

var EventBus = require('./../../components/EventBus');
var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var Team = require('./../../models/team.model');
var Mailer = require('./../../components/Mailer');
var PackageInvite = require('./../../models/packageInvite.model');
var People = require('./../../models/people.model');
var _ = require('lodash');
var config = require('./../../config/environment');
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
        var from = result.editUser.name + "<"+result.editUser.email+">";
        if (request.element.type === "file" && request.notMembers.length > 0) {
            async.each(request.notMembers, function(member, cb) {
                PackageInvite.findOne({project: request.project, to: member}, function(err, packageInvite) {
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
                            subject: result.editUser.name + ' has uploaded for you a file ' + request.name
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
                                PackageInvite.findOne({to: tender.tenderers[0].email}, function(err, packageInvite) {
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
                                            subject: result.editUser.name + ' has uploaded for you a document ' + request.name
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
            var latestActivity = _.last(request.activities);
            var from = result.editUser.name + "<"+result.editUser.email+">";
            if (request.element.type === "document") {
                var roles = ["builders", "clients", "architects", "subcontractors", "consultants"];
                People.findOne({project: request.project}, function(err, people) {
                    if (err || !people) {return next();}
                    async.each(roles, function(role, cb) {
                        async.each(people[role], function(tender, cb) {
                            if (tender.hasSelect) {
                                if (tender.tenderers[0].email) {
                                    PackageInvite.findOne({to: tender.tenderers[0].email}, function(err, packageInvite) {
                                        if (err || !packageInvite) {cb();}
                                        else {
                                            Mailer.sendMail('upload-file-to-non-user.html', from, packageInvite.to, {
                                                team: result.team.toJSON(),
                                                inviter: result.editUser.toJSON(),
                                                invitee: packageInvite.to,
                                                project: result.project.toJSON(),
                                                request: request.toJSON(),
                                                type: "document reversion",
                                                downloadLink: config.baseUrl + "api/files/"+request._id+"/"+latestActivity._id+"/"+packageInvite.to+"/download-via-email",
                                                link : config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                                                subject: result.editUser.name + ' has uploaded for you a document ' + request.name
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
            } else if (request.element.type === "file") {
                var from = result.editUser.name + "<"+result.editUser.email+">";
                async.each(request.notMembers, function(member, cb) {
                    PackageInvite.findOne({to: member}, function(err, packageInvite) {
                        if (err || !packageInvite) {cb();}
                        else {
                            Mailer.sendMail('upload-file-to-non-user.html', from, member, {
                                team: result.team.toJSON(),
                                inviter: result.editUser.toJSON(),
                                invitee: member,
                                project: result.project.toJSON(),
                                request: request.toJSON(),
                                type: "file reversion",
                                downloadLink: config.baseUrl + "api/files/"+request._id+"/"+latestActivity._id+"/"+member+"/download-via-email",
                                link : config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                                subject: result.editUser.name + ' has uploaded for you a file ' + request.name
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
        });
    } else {
        return next();
    }
});