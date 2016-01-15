var Mailer = require('./../../components/Mailer');
var Team = require('./../../models/team.model');
var Project = require('./../../models/project.model');
var EventBus = require('./../../components/EventBus');
var User = require('./../../models/user.model');
var config = require('./../../config/environment');
var async = require('async');
var _ = require('lodash');

EventBus.onSeries('Thread.Updated', function(req, next){
    if (req.messageType != "replyMessage") {
        async.parallel({
            project: function(cb) {
                Project.findById(req.project, cb);
            },
            team: function (cb) {
                Team.findOne({$or:[{leader: request.editUser._id}, {member: request.editUser._id}]}, cb);
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
                                request: request.toJSON(),
                                link: config.baseUrl + "project" + request.project + "/messages/detail/"+request._id,
                                subject: 'New message on ' + request.name
                            },function(err){
                                return cb();
                            });
                        }
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
                                request: request.toJSON(),
                                link: config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                                subject: 'New message on ' + request.name
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