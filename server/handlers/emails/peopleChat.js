'use strict';

var _ = require('lodash');
var Mailer = require('./../../components/Mailer');
var EventBus = require('./../../components/EventBus');
var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var PeopleChat = require('./../../models/peopleChat.model');
var config = require('./../../config/environment');
var async = require('async');
var _ = require('lodash');
var mongoose = require('mongoose');

EventBus.onSeries('PeopleChat.Updated', function(req, next){
    if (req.messageType != "replyMessage") {
        var newestMessage = _.last(req.messages);
        if (newestMessage.mentions) {
            if (newestMessage.mentions.length > 0) {
                async.parallel({
                    project: function(cb) {
                        Project.findById(req.project, cb);
                    } 
                }, function(err, result) {
                    async.each(newestMessage.mentions, function(mention, cb) {
                        User.findById(mention, function(err, user) {
                            if (err || !user) {return cb();}
                            else {
                                Mailer.sendMail('new-message.html', req.editUser.firstName + " " + req.editUser.lastName + "<" + req._id+"-people@mg.buiilt.com.au" + ">", user.email, {
                                    id: req._id,
                                    newestMessage: newestMessage,
                                    sendBy: (req.editUser._id) ? req.editUser : {name: req.editUser.email},
                                    user: user.toJSON(),
                                    project: result.project.toJSON(),
                                    place: result.project.name,
                                    replyMessageLink : config.baseUrl + "api/peopleChats/" + req._id + "/" + user._id.toString() + "/reply-message-from-email",
                                    subject: 'New message on ' + result.project.name
                                },function(err){
                                    return cb();
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
            if (req.ownerEmail || req.fromEmail) {
                var receiveEmail = (req.ownerEmail) ? req.ownerEmail : req.fromEmail;
                async.parallel({
                    project: function(cb) {
                        Project.findById(req.project, cb);
                    } 
                }, function(err, result) {
                    Mailer.sendMail('new-message.html', req.editUser.firstName + " " + req.editUser.lastName + "<" + req._id+"-people@mg.buiilt.com.au" + ">", receiveEmail, {
                        id: req._id,
                        newestMessage: newestMessage,
                        sendBy: (req.editUser._id) ? req.editUser : {name: req.editUser.email},
                        // user: user.toJSON(),
                        project: result.project.toJSON(),
                        place: result.project.name,
                        replyMessageLink : config.baseUrl + "api/peopleChats/" + req._id + "/reply-message-from-email",
                        subject: 'New message on ' + result.project.name
                    },function(err){
                        console.log(err)
                        return next();
                    });
                });
            } else {
                return next();    
            } 
        }
    } else {
        return next();
    }
});