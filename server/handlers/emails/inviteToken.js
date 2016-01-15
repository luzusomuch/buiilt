var Mailer = require('./../../components/Mailer');
var EventBus = require('./../../components/EventBus');
var config = require('./../../config/environment');
var InviteToken = require('./../../models/inviteToken.model');
var Project = require('./../../models/project.model');
var User = require('./../../models/user.model');
var Team = require('./../../models/team.model');
var async = require("async");

EventBus.onSeries('InviteToken.Inserted', function(request, next) {
    var from = request.editUser.name + " | " + request.name + "<"+request.editUser.email+">";
    if (request.type === "project-invite") {
        async.parallel({
            project: function (cb) {
                Project.findById(request.element.project, cb);
            },
            team: function (cb) {
                Team.findOne({$or:[{leader: request.editUser._id}, {member: request.editUser._id}]}, cb);
            }
        }, function(err, result) {
            if (err) 
                return next();
            else {
                if (request.user) {
                    User.findById(request.user, function(err, user) {
                        if (err || !user) {return next();}
                        Mailer.sendMail('invite-user-to-project.html', from, user.email, {
                            team: result.team.toJSON(),
                            project: result.project.toJSON(),
                            inviter: request.editUser.toJSON(),
                            invitee: user.toJSON(),
                            link : config.baseUrl + 'projects/open',
                            subject: request.editUser.name + ' has invited you to project ' + result.project.name
                        },function(err){
                           return next();
                        });
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