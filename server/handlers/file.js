'use strict';

var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var Project = require('./../models/project.model');
var Team = require('./../models/team.model');
var Mailer = require('./../components/Mailer');
var PackageInvite = require('./../../models/packageInvite.model');
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
        async.each(request.members, function(member, cb) {
            if (member.email) {
                packageInvite.findOne({to: member.email}, function(err, packageInvite) {
                    if (err || !packageInvite) {cb();}
                    else {
                        Mailer.sendMail('upload-file-to-non-user.html', from, member.email, {
                            team: result.team.toJSON(),
                            inviter: result.editUser.toJSON(),
                            invitee: member.email,
                            project: result.project.toJSON(),
                            request: request.toJSON(),
                            link : config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                            subject: req.editUser.name + ' has uploaded for you a  ' + request.name
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