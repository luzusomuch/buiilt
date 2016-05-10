var Mailer = require('./../../components/Mailer');
var Team = require('./../../models/team.model');
var Project = require('./../../models/project.model');
var EventBus = require('./../../components/EventBus');
var User = require('./../../models/user.model');
var config = require('./../../config/environment');
var async = require('async');
var PackageInvite = require('./../../models/packageInvite.model');
var _ = require('lodash');

EventBus.onSeries('Task.Inserted', function(req, next){
    return next();
});

EventBus.onSeries('Task.Updated', function(task, next){
    if (task._modifiedPaths.indexOf('assignees') != -1) {
        Team.findOne({$or:[{leader: task.editUser._id}, {member: task.editUser._id}]}, function(err, team) {
            if (err || !team) {return next();}
            var from = task.editUser.name + " | " + team.name + "<"+task.editUser.email+">";
            if (task._oldAssigneesUnactive) {
                task._oldAssigneesUnactive = task._oldAssigneesUnactive.map(function (e) { return e.toString(); });
                async.each(task.notMembers, function(email, cb) {
                    if (task._oldAssigneesUnactive.indexOf(email.toString()) !== -1) {
                        cb();
                    } else {
                        Mailer.sendMail('assign-task-to-non-user.html', from, packageInvite.to, {
                            team: team.toJSON(),
                            inviter: task.editUser.toJSON(),
                            invitee: email,
                            link : config.baseUrl + 'signup',
                            subject: task.editUser.name + ' has assigned you to task ' + result.project.name
                        }, cb);
                    }
                }, function(){
                    return next();
                });
            } else {
                return next();
            }
        });
    } else {
        return next();
    }
});