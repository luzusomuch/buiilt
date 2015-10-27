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
        if (req.newInvitee) {
            var from = req.editUser.name + "<"+req.editUser.email+">";
            Project.findById(req.project, function(err, project) {
                if (err || !project) {return next();}
                var packageInvite = new PackageInvite({
                    owner: req.editUser._id,
                    project: req.project,
                    package: req._id,
                    inviteType : req.newInviteType,
                    to: req.newInvitee,
                    user: req.editUser._id
                });
                packageInvite.save(function(err,saved){
                    if (err) {return next();}
                    Mailer.sendMail('invite-people-has-no-account.html', from, saved.to, {
                        user: req.editUser.toJSON(),
                        project: project.toJSON(),
                        registryLink : config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                        subject: 'Join ' + project.name + ' on buiilt'
                    },function(){
                        return next();
                    });
                });
            });
        } else {
            return next();
        }
    } else {
        return next();
    }
});
