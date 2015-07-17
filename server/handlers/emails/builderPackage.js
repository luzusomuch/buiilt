var _ = require('lodash');
'use strict';

var Mailer = require('./../../components/Mailer');
var EventBus = require('./../../components/EventBus');
var Project = require('./../../models/project.model');
var Team = require('./../../models/team.model');
var User = require('./../../models/user.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var PackageInvite = require('./../../models/packageInvite.model');
var config = require('./../../config/environment');
var async = require('async');

EventBus.onSeries('BuilderPackage.Inserted', function(request, next) {
  async.parallel({
    team: function(cb) {
      Team.findById(request.owner, cb);
    },
    project: function(cb){
      Project.findById(request.project, cb);
    }
  },function(err,result){
    if (err) {return next();}
    var subjectType = (request.to.type == 'homeOwner') ? 'homeowner' : 'builder';
    if (request.to.email) {
      var packageInvite = new PackageInvite({
        owner: request.owner,
        project: request.project,
        package: request._id,
        inviteType : request.to.type,
        to: request.to.email
      });
      packageInvite.save(function(err) {
        if(err){ next(); }
        Mailer.sendMail('invite-' + subjectType + '-has-no-account.html', request.to.email, {
          project: result.project.toJSON(),
          team: result.team.toJSON(),
          registryLink : config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
          subject: 'Invite ' + subjectType + ' send quote for ' + request.name
        },function(){
         return next();
        });
      });
    } else {
      Team.findById(request.to.team)
        .populate('leader')
        .exec(function(err, team) {
          if(err || !team){ next(); }

          if (result.team.type == request.to.type) {
            team.leader.forEach(function(leader) {
              Mailer.sendMail('invite-' + subjectType + '.html', leader.email, {
                project: result.project.toJSON(),
                team: result.team.toJSON(),
                link: config.baseUrl + request.project._id + '/dashboard',
                subject: 'Invite ' + subjectType + ' send quote for ' + request.name
              }, function () {
                return next();
              });
            });
          }else{
            return next();
          }
      });
    }
  });
});