/**
 * Broadcast updates to client when the model changes
 */
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

EventBus.onSeries('People.Updated', function(req, next){
    if (req._modifiedPaths.indexOf('invitePeople') != -1) {
        if (req.newInviteeNotSignUp && req.newInviteeNotSignUp.length > 0) {
            var from = req.editUser.name + "<"+req.editUser.email+">";
            async.parallel({
                project: function (cb) {
                    Project.findById(req.project, cb);
                },
                team: function (cb) {
                    Team.findOne({$or:[{leader: req.editUser._id}, {member: req.editUser._id}]}, cb);
                }
            }, function(err, result) {
                if (err) {return next();}
                async.each(req.newInviteeNotSignUp, function(invitee, cb){
                    var packageInvite = new PackageInvite({
                        owner: req.editUser._id,
                        project: req.project,
                        package: req._id,
                        inviteType : req.newInviteType,
                        to: invitee,
                        user: req.editUser._id
                    });
                    packageInvite.save(function(err,saved){
                        if (err) {return cb(err);}
                        Mailer.sendMail('invite-non-user-to-project.html', from, saved.to, {
                            team: result.team.toJSON(),
                            inviter: req.editUser.toJSON(),
                            invitee: saved.to,
                            project: result.project.toJSON(),
                            link : config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                            subject: req.editUser.name + ' has invited you to project ' + result.project.name
                        },function(err){console.log(err);
                            return cb();
                        });
                    });
                }, function(){
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
