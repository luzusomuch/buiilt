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
    return next();
});

EventBus.onSeries('Thread.NewMessage', function(req, next) {
    console.log(req.notMembers);
    if (req.notMembers.length > 0) {
        async.each(req.notMembers, function(email, callback) {
            Mailer.sendMail('new-message.html', req.message.user.name + "<" + req._id+"@mg.buiilt.com.au" + ">", email, {
                newestMessage: req.message,
                sendBy: req.message.user.toJSON(),
                // team: result.team.toJSON(),
                link: config.baseUrl + "signup",
                subject: 'New message on ' + req.name
            },callback);
        }, function() {
            return next();
        });
    } else {
        return next();
    }
});

EventBus.onSeries('Thread.Updated', function(req, next){
    return next();
    // if (req.messageType === "sendMessage") {
    //     async.parallel({
    //         project: function(cb) {
    //             Project.findById(req.project, cb);
    //         },
    //         team: function (cb) {
    //             Team.findOne({$or:[{leader: req.editUser._id}, {member: req.editUser._id}]}, cb);
    //         }
    //     }, function(err, result) {
    //         if (err) {return next();}
    //         var newestMessage = _.last(req.messages);
    //         // new version that sent email to not members people in thread
    //         console.log(req.notMembers);
    //         if (req.notMembers.length > 0) {
    //             async.each(req.notMembers, function(email, callback) {
    //                 Mailer.sendMail('new-message.html', req.editUser.name + "<" + req._id+"@mg.buiilt.com.au" + ">", email, {
    //                     newestMessage: newestMessage,
    //                     sendBy: req.editUser.toJSON(),
    //                     team: result.team.toJSON(),
    //                     link: config.baseUrl + "signup",
    //                     subject: 'New message on ' + req.name
    //                 },callback);
    //             }, function() {
    //                 return next();
    //             });
    //         }

    //         // old version that sent email to mention people
    //         // if (newestMessage.mentions && newestMessage.mentions.length > 0) {
    //         //     async.each(newestMessage.mentions, function(mention, cb) {
    //         //         User.findById(mention, function(err, user) {
    //         //             if (err || !user) {return cb();}
    //         //             else {
    //         //                 Mailer.sendMail('new-message.html', req.editUser.name + "<" + req._id+"@mg.buiilt.com.au" + ">", user.email, {
    //         //                     newestMessage: newestMessage,
    //         //                     user: user.toJSON(),
    //         //                     sendBy: req.editUser.toJSON(),
    //         //                     project: result.project.toJSON(),
    //         //                     team: result.team.toJSON(),
    //         //                     request: req.toJSON(),
    //         //                     link: config.baseUrl + "project" + req.project + "/messages/detail/"+req._id,
    //         //                     subject: 'New message on ' + req.name
    //         //                 },function(err){
    //         //                     return cb();
    //         //                 });
    //         //             }
    //         //         });
    //         //     }, function() {
    //         //         return next();
    //         //     });
    //         else {
    //             return next();
    //         }
    //     });
    // } else {
    //     return next();
    // }
});