'use strict';

var EventBus = require('./../../components/EventBus');
var User = require('./../../models/user.model');
var Document = require('./../../models/document.model');
var Project = require('./../../models/project.model');
var Team = require('./../../models/team.model');
var Mailer = require('./../../components/Mailer');
var PackageInvite = require('./../../models/packageInvite.model');
var People = require('./../../models/people.model');
var _ = require('lodash');
var config = require('./../../config/environment');
var async = require('async');


EventBus.onSeries('File.Inserted', function(data, next) {
    return next();
});

EventBus.onSeries('File.Updated', function(data, next) {
    if (data._editType==="uploadReversion") {
        var notMembers = [];
        async.parallel([
            function (cb) {
                if (data.element.type==="file") {
                    notMembers = data.notMembers;
                    cb();
                } else if (data.element.type==="document" && data.documentSet) {
                    Document.findById(data.documentSet, function(err, documentSet) {
                        if (err||!documentSet) {cb();}
                        else {
                            notMembers = documentSet.notMembers;
                            cb();
                        }
                    });
                } else {
                    cb();
                }
            }
        ], function() {
            if (notMembers.length > 0) {
                Team.findOne({$or:[{leader: data.editUser._id}, {member: data.editUser._id}]}, function(err, team) {
                    if (err || !team) {return next();}
                    var from = data.editUser.name + " | " + team.name + "<"+data.editUser.email+">";
                    async.each(notMembers, function(email, cb) {
                        Mailer.sendMail('upload-file-to-non-user.html', from, email, {
                            downloadLink: data.fileHistory[data.fileHistory.length-1].link,
                            team: team.toJSON(),
                            request: data.toJSON(),
                            inviter: data.editUser.toJSON(),
                            invitee: email,
                            link : config.baseUrl + 'signup',
                            subject: data.editUser.name + ' has uploaded reversion of ' + data.name
                        },function(err){
                            console.log(err);
                            cb();
                        });
                    }, function(){
                        return next();
                    });
                });
            } else {
                return next();
            }
        });
    } else {
        return next();
    }
});