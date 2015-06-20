var _ = require('lodash');
'use strict';

var Mailer = require('./../../components/Mailer');
var EventBus = require('./../../components/EventBus');
var Project = require('./../../models/project.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var ContractorPackage = require('./../../models/contractorPackage.model');
var User = require('./../../models/user.model');
var config = require('./../../config/environment');
var async = require('async');

EventBus.onSeries('Team.Inserted', function(request, next){
    async.each(request.member, function(user,callback) {
      if (!user._id && user.status == 'Pending') {
          Mailer.sendMail('invite-team-has-no-account.html', user.email, {
              request: request,
              link: config.baseUrl + 'signup?inviteToken=' + request.teamInviteToken,
              subject: 'Group invitation ' + request.name
          }, function(err) {
            callback();
            return next();
          });
      } else if (user._id && user.status == 'Pending')  {
        Mailer.sendMail('invite-team-has-account.html', user.email, {
          request: request,
          subject: 'Group invitation ' + request.name
        }, function(err) {
          callback();
          return next();
        });
      }
    },function() {
      return next();
    });
});

EventBus.onSeries('Team.Updated', function(request, next){
  async.each(request.member, function(user,callback) {
    if (!user._id && user.status == 'Pending') {

      Mailer.sendMail('invite-team-has-no-account.html', user.email, {
        request: request,
        link: config.baseUrl + 'signup?teamInviteToken=' + request.teamInviteToken,
        subject: 'Group invitation ' + request.name
      }, function(err) {
        callback();
        return next();
      });
    } else if (user._id && user.status == 'Pending')  {
      Mailer.sendMail('invite-team-has-account.html', user._id.email, {
        request: request,
        subject: 'Group invitation ' + request.name
      }, function(err) {
        callback();
        return next();
      });
    }
  },function() {
    return next();
  });
});