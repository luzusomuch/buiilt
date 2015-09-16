var Notification = require('./../../models/notification.model');
var Mailer = require('./../Mailer');
var PackageInvite = require('./../../models/packageInvite.model');
var InviteToken = require('./../../models/inviteToken.model');
var Team = require('./../../models/team.model');
var User = require('./../../models/user.model');
var config = require('./../../config/environment');
var async = require('async');
var _ = require('lodash');

exports.run = function(){
    var execArray = ['PackageInvite', 'Notification', 'InviteToken'];
    var result = [];
    async.each(execArray, function(item, callback){
        if (item == 'PackageInvite') {
            PackageInvite.find({}, function(err, packageInvites){
                if (err || packageInvites.length == 0) {return callback();}
                result.push({type: 'PackageInvite', data: packageInvites});
                callback();
            });
        }
        else if (item == 'Notification') {
            Notification.find({
                $or:[{referenceTo: 'task'},{referenceTo: 'thread'},
                {type: 'uploadDocument'},{type: 'uploadNewDocumentVersion'}],
                unread: true
            }, function(err, notifications){
                if (err || notifications.length == 0) {return callback();}
                result.push({type: 'Notification', data: notifications});
                callback();
            })
        }
        else if (item == 'InviteToken') {
            InviteToken.find({}, function(err, inviteTokens){
                if (err || inviteTokens.length == 0) {return callback();}
                result.push({type: 'InviteToken', data: inviteTokens});
                callback();
            })
        }
        else {
            callback();
        }
    }, function(err){
        if (err) {return res.send(500,err);}
        else {
            var templateUrl = '';
            _.each(result, function(item){
                if (item.type == 'PackageInvite') {
                    _.each(item.data, function(data){
                        if (data.inviteType == 'contractor') {
                            templateUrl = 'contractor-package-request-no-account.html';
                        }
                        else if (data.inviteType == 'supplier') {
                            templateUrl = 'supplier-package-send-quote-no-account.html'
                        }
                        else if (data.inviteType == 'homeOwner') {
                            templateUrl = 'invite-homeowner-has-no-account.html';
                        }
                        else if (data.inviteType == 'builder') {
                            templateUrl = 'invite-builder-has-no-account.html';
                        }
                        else {
                            templateUrl = '';
                        }
                        async.parallel({
                            user: function(cb){
                                User.findOne({_id: data.user}, cb);
                            },
                            team: function(cb){
                                Team.findOne({_id: data.owner}, cb);
                            }
                        }, function(err, result){
                            if (!err) {
                                var from = result.user.firstName + " " + result.user.lastName + " | " + result.team.name + "<"+result.user.email+">";
                                Mailer.sendMail(templateUrl, from, data.to, {
                                    team: result.team.toJSON(),
                                    user: result.user.toJSON(),
                                    registryLink : config.baseUrl + 'signup-invite?packageInviteToken=' + data._id,
                                    subject: result.team.name + ' would like a quote'
                                }, function(){});
                            }
                        });
                    });
                }
                else if (item.type == 'InviteToken') {
                    async.each(item.data, function(data, cb){
                        User.findById(data.user, function(err, user){
                            if (err || !user) {return cb(err);}
                            var from = user.firstName + " " + user.lastName + " | " + data.element.name + "<"+user.email+">";
                            Mailer.sendMail('invite-team-has-no-account.html', from, data.email, {
                                request: user.toJSON,
                                link: config.baseUrl + 'signup?inviteToken=' + data.inviteToken,
                                subject: 'Join ' + data.element.name + ' on buiilt'
                            }, function(err){console.log(err);return cb(err);});
                        });
                    }, function(){console.log('success');});
                }
                else if (item.type == 'Notification') {
                    // console.log(item.data);
                }
            });
        }
    });
};