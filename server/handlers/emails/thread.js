var Mailer = require('./../../components/Mailer');
var Team = require('./../../models/team.model');
var Project = require('./../../models/project.model');
var PackageInvite = require('./../../models/packageInvite.model');
var EventBus = require('./../../components/EventBus');
var User = require('./../../models/user.model');
var config = require('./../../config/environment');
var async = require('async');
var _ = require('lodash');

EventBus.onSeries("Thread.Inserted", function(thread, next) {
    if (thread.notMembers && thread.notMembers.length > 0) {
        Team.findOne({$or:[{leader: thread.editUser._id}, {member: thread.editUser._id}]}, function(err, team) {
            if (err || !team) 
                return next();
            else {
                async.each(thread.notMembers, function(member, cb) {
                    PackageInvite.findOne({project: thread.project, to: member}, function(err, packageInvite) {
                        if (err || !packageInvite) 
                            cb();
                        else {
                            var newestMessage = _.last(thread.messages);
                            Mailer.sendMail('message-to-non-user.html', thread.editUser.name + "<" + thread._id+"@mg.buiilt.com.au" + ">", member, {
                                newestMessage: newestMessage,
                                user: member,
                                sendBy: thread.editUser.toJSON(),
                                team: team.toJSON(),
                                request: thread.toJSON(),
                                link: config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                                subject: 'New message on ' + thread.name
                            },function(err){
                                console.log(err)
                                cb();
                            });
                        }
                    });
                }, function() {
                    return next();
                });
            }
        });
    } else 
        return next();
});

EventBus.onSeries('Thread.NewMessage', function(req, next) {
    if (req.messageType === "sendMessage") {
        async.parallel({
            project: function(cb) {
                Project.findById(req.project, cb);
            },
            team: function (cb) {
                Team.findOne({$or:[{leader: req.message.user._id}, {member: req.message.user._id}]}, cb);
            }
        }, function(err, result) {
            if (err) {return next();}
            var newestMessage = _.last(req.messages);
            if (req.notMembers && req.notMembers.length > 0) {
                async.each(req.notMembers, function(member, cb) {
                    User.findOne({email: member}, function(err, user) {
                        if (err) 
                            cb();
                        else if (!user) {
                            PackageInvite.findOne({project: req.project, to: member}, function(err, packageInvite) {
                                if (err || !packageInvite) 
                                    cb();
                                else {
                                    Mailer.sendMail('message-to-non-user.html', req.message.user.name + "<" + req._id+"@mg.buiilt.com.au" + ">", member, {
                                        newestMessage: newestMessage,
                                        user: member,
                                        sendBy: req.message.user.toJSON(),
                                        team: result.team.toJSON(),
                                        request: req.toJSON(),
                                        link: config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                                        subject: 'New message on ' + req.name
                                    },function(err){
                                        console.log(member);
                                        console.log(err);
                                        cb();
                                    });
                                }
                            });
                        } else
                            cb();
                    });
                }, function() {
                    return next();
                });
            } else 
                return next();
        });
    } else 
        return next();
});

EventBus.onSeries('Thread.Updated', function(req, next){
    if (req.messageType === "sendMessage") {
        async.parallel({
            project: function(cb) {
                Project.findById(req.project, cb);
            },
            team: function (cb) {
                Team.findOne({$or:[{leader: req.editUser._id}, {member: req.editUser._id}]}, cb);
            }
        }, function(err, result) {
            if (err) {return next();}
            var newestMessage = _.last(req.messages);
            if (newestMessage.mentions && newestMessage.mentions.length > 0) {
                async.each(newestMessage.mentions, function(mention, cb) {
                    User.findById(mention, function(err, user) {
                        if (err || !user) {return cb();}
                        else {
                            Mailer.sendMail('new-message.html', req.editUser.name + "<" + req._id+"@mg.buiilt.com.au" + ">", user.email, {
                                newestMessage: newestMessage,
                                user: user.toJSON(),
                                sendBy: req.editUser.toJSON(),
                                project: result.project.toJSON(),
                                team: result.team.toJSON(),
                                request: req.toJSON(),
                                link: config.baseUrl + "project" + req.project + "/messages/detail/"+req._id,
                                subject: 'New message on ' + req.name
                            },function(err){
                                return cb();
                            });
                        }
                    });
                }, function() {
                    return next();
                });
            } else if (req.notMembers && req.notMembers.length > 0) {
                console.log("IT GOEST HERE");
                async.each(req.notMembers, function(member, cb) {
                    User.findOne({email: member}, function(err, user) {
                        if (err) 
                            cb();
                        else if (!user) {
                            PackageInvite.findOne({project: req.project, to: member}, function(err, packageInvite) {
                                if (err || !packageInvite) 
                                    cb();
                                else {
                                    Mailer.sendMail('message-to-non-user.html', req.editUser.name + "<" + req._id+"@mg.buiilt.com.au" + ">", member, {
                                        newestMessage: newestMessage,
                                        user: member,
                                        sendBy: req.editUser.toJSON(),
                                        team: result.team.toJSON(),
                                        request: req.toJSON(),
                                        link: config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                                        subject: 'New message on ' + req.name
                                    },function(err){
                                        console.log(member);
                                        console.log(err);
                                        cb();
                                    });
                                }
                            });
                        } else
                            cb();
                    });
                }, function() {
                    return next();
                });
            } else {
                if (req.ownerEmail || req.fromEmail) {
                    var receiveEmail = (req.ownerEmail) ? req.ownerEmail : req.fromEmail;
                    PackageInvite.findOne({project: req.project, package: req.people, to: receiveEmail}, function(err, packageInvite){
                        if (err || !packageInvite) {console.log('it goes here'); return next();}
                        else {
                            Mailer.sendMail('message-to-non-user.html', req.editUser.name + "<" + req._id+"@mg.buiilt.com.au" + ">", receiveEmail, {
                                newestMessage: newestMessage,
                                user: receiveEmail,
                                sendBy: req.editUser.toJSON(),
                                project: result.project.toJSON(),
                                team: result.team.toJSON(),
                                request: req.toJSON(),
                                link: config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                                subject: 'New message on ' + req.name
                            },function(err){
                                console.log(err)
                                return next();
                            });
                        }
                    });
                } else {
                    return next();    
                } 
            }
        });
    } else {
        return next();
    }
});