var _ = require('lodash');
'use strict';

var Mailer = require('./../../components/Mailer');
var EventBus = require('./../../components/EventBus');
var InviteToken = require('./../../models/inviteToken.model');
var User = require('./../../models/user.model');
var config = require('./../../config/environment');
var async = require('async');

EventBus.onSeries('Team.Inserted', function(request, next){
  var from = request.user.firstName + " " + request.user.lastName + " | " + request.name + "<"+request.user.email+">";
    async.each(request.member, function(user,callback) {
      if (!user._id && user.status == 'Pending') {
        var inviteToken = new InviteToken({
          email : user.email,
          element : request,
          type : 'team-invite',
          user: request.user._id
        });
        inviteToken.save(function(err) {
          if (err) { return callback(err);}
          Mailer.sendMail('invite-team-has-no-account.html', from, user.email, {
            request: request.toJSON(),
            link: config.baseUrl + 'signup?inviteToken=' + inviteToken.inviteToken,
            subject: 'Join ' + request.name + ' on buiilt'
          },function(err) {
            return callback(err);
          });
        })
      } else if (user._id && user.status == 'Pending')  {
        Mailer.sendMail('invite-team-has-account.html', from, user.email, {
          request: request.toJSON(),
          subject: 'Join ' + request.name + ' on buiilt'
        }, function(err) {
          return callback(err);
        });
      }else{
		    return callback();
      }
    },function() {
      return next();
    });
});

EventBus.onSeries('Team.Updated', function(request, next){
  var from = request.user.firstName + " " + request.user.lastName + " | " + request.name + "<"+request.user.email+">";
  async.each(request.member, function(user, cb) {
    if (!user._id && user.status == 'Pending' && !(_.find(request.oldMember,{ email : user.email}))) {
      var inviteToken = new InviteToken({
        email : user.email,
        element : request,
        type : 'team-invite',
        user: request.user._id
      });
      inviteToken.save(function(err) {
        if (err) {
          return cb(err);
        }
        Mailer.sendMail('invite-team-has-no-account.html', from, user.email, {
          request: request.toJSON(),
          link: config.baseUrl + 'signup?inviteToken=' + inviteToken.inviteToken,
          subject: 'Join ' + request.name + ' on buiilt'
        }, function() {
          return cb();
        });
      });

    } else if (user._id && user.status == 'Pending' && !(_.find(request.oldMember,{ _id : user._id})))  {
      Mailer.sendMail('invite-team-has-account.html', from, user._id.email, {
        request: request.toJSON(),
        subject: 'Join ' + request.name + ' on buiilt'
      }, function() {
        return cb();
      });
    }
    else {
      return cb();
    }
  }, function(){
    return next();
  });
});