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
  var subjectType = (request.to.type == 'homeOwner') ? 'home owner' : 'builder';

  if (request.to.email) {
    var packageInvite = new PackageInvite({
      owner: request.owner,
      project: request.project,
      package: request._id,
      inviteType : request.to.type,
      to: request.to.email
    });

    packageInvite.save(function(err) {
      if(err){ return next(); }

      Mailer.sendMail('invite-' + request.to.type + '-has-no-account.html', request.to.email, {
        project: request.project,
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
        if(err || !team){ return next(); }

        if (team.type == request.to.type) {
          team.leader.forEach(function(leader) {
            Mailer.sendMail('invite-' + request.to.type + '.html', leader.email, {
              project: request.project,
              link: config.baseUrl + request.project._id + '/dashboard',
              subject: 'Invite ' + subjectType + ' send quote for ' + request.name
            }, function () {
              next();
            });
          });
        }else{
          return next();
        }
    });
  }
});