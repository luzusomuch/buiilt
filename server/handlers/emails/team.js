var _ = require('lodash');
'use strict';

var Mailer = require('./../../components/Mailer');
var EventBus = require('./../../components/EventBus');
var TeamInvite = require('./../../models/teamInvite.model');
var User = require('./../../models/user.model');
var config = require('./../../config/environment');
var async = require('async');

EventBus.onSeries('Team.Inserted', function(request, next){
    async.each(request.member, function(user,callback) {
      if (!user._id && user.status == 'Pending') {
        var teamInvite = new TeamInvite({
          email : user.email,
          team : request
        });
        teamInvite.save(function(err) {
          if (err) {
            throw err;
          }
          Mailer.sendMail('invite-team-has-no-account.html', user.email, {
            request: request,
            link: config.baseUrl + 'signup?teamInviteToken=' + teamInvite.teamInviteToken,
            subject: 'Group invitation ' + request.name
          },function(err) {
            if (err) {
              throw err;
              callback();
            }
          });
        })
      } else if (user._id && user.status == 'Pending')  {
        Mailer.sendMail('invite-team-has-account.html', user.email, {
          request: request,
          subject: 'Group invitation ' + request.name
        }, function(err) {
          callback();
        });
      }
    },function() {
      return next();
    });
});

EventBus.onSeries('Team.Updated', function(request, next){
  request.member.forEach(function(user) {
    if (!user._id && user.status == 'Pending' && !(_.find(request.oldMember,{ email : user.email}))) {
      var teamInvite = new TeamInvite({
        email : user.email,
        team : request
      });
      teamInvite.save(function(err) {
        if (err) {
          throw err;
        }
        Mailer.sendMail('invite-team-has-no-account.html', user.email, {
          request: request,
          link: config.baseUrl + 'signup?teamInviteToken=' + teamInvite.teamInviteToken,
          subject: 'Group invitation ' + request.name
        }, function(err) {
          if (err) {
            throw err;
          }
        });
      })

    } else if (user._id && user.status == 'Pending')  {
      Mailer.sendMail('invite-team-has-account.html', user._id.email, {
        request: request,
        subject: 'Group invitation ' + request.name
      }, function(err) {
      });
    }
  });
  return next();
});