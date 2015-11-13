'use strict';

var Mailer = require('./../../components/Mailer');
var Team = require('./../../models/team.model');
var Project = require('./../../models/project.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var EventBus = require('./../../components/EventBus');
var User = require('./../../models/user.model');
var PackageInvite = require('./../../models/packageInvite.model');
var config = require('./../../config/environment');
var async = require('async');
var _ = require('lodash');

EventBus.onSeries('Board.Inserted', function(board, next){
    if (board.invitees[0].email) {
        async.parallel({
            project: function(cb) {
                Project.findById(board.project, cb);
            },
            owner: function(cb) {
                User.findById(board.owner, cb);
            }
        }, function(err, result){
            if (err) {return next();}
            else {
                var from = result.owner.firstName + " " + result.owner.lastName + "<"+result.owner.email+">";
                var packageInvite = new PackageInvite({
                    owner: board.owner,
                    project: board.project,
                    package: board._id,
                    inviteType : 'inviteToBoardPage',
                    to: board.invitees[0].email,
                    user: board.owner
                });
                packageInvite.save(function(err){
                    if (err) {return next();}
                    Mailer.sendMail('invite-people-to-board-has-no-account.html', from, packageInvite.to, {
                        user: result.owner.toJSON(),
                        project: result.project.toJSON(),
                        registryLink : config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                        subject: 'Join ' + result.project.name + ' on buiilt'
                    },function(){
                        return next();
                    });
                });
            }
        });
    } else {
        return next();
    }
});

EventBus.onSeries('Board.Updated', function(board, next){
    if (board._modifiedPaths.indexOf('invitePeople') != -1) {
        if (board.inviteEmail) {
            async.parallel({
                project: function(cb) {
                    Project.findById(board.project, cb);
                },
                owner: function(cb) {
                    User.findById(board.owner, cb);
                }
            }, function(err, result){
                if (err) {return next();}
                else {
                    var from = result.owner.firstName + " " + result.owner.lastName + "<"+result.owner.email+">";
                    var packageInvite = new PackageInvite({
                        owner: board.owner,
                        project: board.project,
                        package: board._id,
                        inviteType : 'inviteToBoardPage',
                        to: board.inviteEmail,
                        user: board.owner
                    });
                    packageInvite.save(function(err){
                        if (err) {return next();}
                        Mailer.sendMail('invite-people-to-board-has-no-account.html', from, packageInvite.to, {
                            user: result.owner.toJSON(),
                            project: result.project.toJSON(),
                            registryLink : config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                            subject: 'Join ' + result.project.name + ' on buiilt'
                        },function(){
                            return next();
                        });
                    });
                }
            });
        } else {
            return next();
        }
    } else if (board._modifiedPaths.indexOf('sendMessage') != -1) {
        console.log('aaaaaaaaaaaaaaaa');
        console.log(board);
        var from = board.editUser.firstName + " " + board.editUser.lastName + "<"+board.editUser.email+">";
        var newestMessage = _.last(board.messages);
        if (newestMessage.mentions.length > 0) {
            async.parallel({
                project: function(cb) {
                    Project.findById(board.project, cb);
                }
            }, function(err,result) {
                async.each(newestMessage.mentions, function(mention, cb) {
                    User.findById(mention, function(err, user) {
                        if (err || !user) {return cb();}
                        else {
                            Mailer.sendMail('new-message.html', from, user.email, {
                                newestMessage: newestMessage,
                                sendBy: board.editUser,
                                user: user.toJSON(),
                                project: result.project.toJSON(),
                                board: board,
                                replyMessageLink : config.baseUrl + "api/boards/" + board._id + "/" + user._id.toString() + "/reply-message-from-email",
                                subject: 'Join ' + result.project.name + ' on buiilt'
                            },function(){
                                return next();
                            });
                        }
                    });
                }, function() {
                    return next();
                });
            });
        } else {
            return next();
        }
    } else {
        return next();
    }
});