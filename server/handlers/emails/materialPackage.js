/**
 * Broadcast updates to client when the model changes
 */
var _ = require('lodash');
'use strict';

var Mailer = require('./../../components/Mailer');
var EventBus = require('./../../components/EventBus');
var Project = require('./../../models/project.model');
var Team = require('./../../models/team.model');
var User = require('./../../models/user.model');
var MaterialPackage = require('./../../models/materialPackage.model');
var PackageInvite = require('./../../models/packageInvite.model');
var Notification = require('./../../models/notification.model');
var NotificationHelper = require('./../../components/helpers/notification');
var config = require('./../../config/environment');
var async = require('async');

/**
 * event handler after creating new quote
 */
//contractor-package-request.html
EventBus.onSeries('MaterialPackage.Inserted', function(request, next) {
  async.parallel({
    user: function(cb) {
      User.findOne({_id: request.ownerUser._id}, cb);
    },
    team: function(cb){
      Team.findOne({_id: request.owner}, cb);
    },
    project: function(cb) {
      //find project
      Project.findOne({_id: request.project}, cb);
    }
  }, function(err, result) {
    if (err) {
      return next();
    }
    var from = result.user.firstName + " " + result.user.lastName + " | " + result.team.name + "<"+result.user.email+">";
    if (request.isSkipInTender == true) {
      var winner = _.first(request.to);
      if (!winner._id) {
        var packageInvite = new PackageInvite({
          owner: result.user.team._id,
          inviteType: 'supplier',
          project: result.project._id,
          package: request._id,
          isSkipInTender: request.isSkipInTender,
          to: winner.email
        });
        packageInvite.save(function(err, saved){
          if (err) {return next();}
          Mailer.sendMail('supplier-package-send-quote-no-account.html', from, saved.to, {
            team: result.team.toJSON(),
            materialPackage: request.toJSON(),
            user: result.user.toJSON(),
            project: result.project.toJSON(),
            registryLink : config.baseUrl + 'signup-invite?packageInviteToken=' + saved._id,
            subject: result.team.name + ' would like a quote'
          },function(){
           return next();
          });
        });
      }
      else {
        Team.findOne({_id: winner._id}, function(err, team) {
          if (err || !team) {
            return next();
          }
          async.each(team.leader, function(leader, callback) {
            User.findById(leader, function(err, user) {
              if (err || !user) {
                return callback(err);
              }
              Mailer.sendMail('supplier-package-send-quote.html', from, user.email, {
                materialPackage: request.toJSON(),
                //project owner
                team: result.team.toJSON(),
                user: result.user.toJSON(),
                project: result.project.toJSON(),
                link: config.baseUrl + result.project._id + '/material-request/' + request._id,
                subject: result.team.name + ' would like a quote'
              }, function() {
                return callback();
              });
            });
          }, function() {
            return next();
          });
        });
      }
    }
    else {
      async.each(request.to, function(supplier, cb) {
        if (!supplier._id) {
          var packageInvite = new PackageInvite({
            owner: result.user.team._id,
            inviteType: 'supplier',
            project: result.project._id,
            package: request._id,
            isSkipInTender: request.isSkipInTender,
            to: supplier.email
          });
          packageInvite.save(function(err, saved){
            if (err) {return cb(err);}
            Mailer.sendMail('supplier-package-send-quote-no-account.html', from, saved.to, {
              team: result.team.toJSON(),
              materialPackage: request.toJSON(),
              user: result.user.toJSON(),
              project: result.project.toJSON(),
              registryLink : config.baseUrl + 'signup-invite?packageInviteToken=' + saved._id,
              subject: result.team.name + ' would like a quote'
            },function(){
             return cb();
            });
          });
        }
        else {
          Team.findOne({_id: supplier._id}, function(err, team) {
            if (err || !team) {
              return cb(err);
            }
            async.each(team.leader, function(leader, callback) {
              User.findById(leader, function(err, user) {
                if (err || !user) {
                  return callback(err);
                }
                Mailer.sendMail('supplier-package-send-quote.html', from, user.email, {
                  materialPackage: request.toJSON(),
                  //project owner
                  team: result.team.toJSON(),
                  user: result.user.toJSON(),
                  project: result.project.toJSON(),
                  link: config.baseUrl + result.project._id + '/material-request/' + request._id,
                  subject: result.team.name + ' would like a quote'
                }, function() {
                  return callback();
                });
              });
            }, function() {
              return cb();
            });
          });
        }
      }, function(){
        return next();
      });
    }
  });
});

EventBus.onSeries('MaterialPackage.Updated', function(request, next) {
  
  if (request._modifiedPaths.indexOf('inviteMaterial') != -1) {
    async.parallel({
      user: function(cb) {
        User.findOne({_id: request.editUser._id}, cb);
      },
      team: function(cb){
        Team.findOne({_id: request.owner}, cb);
      },
      project: function(cb) {
        //find project
        Project.findOne({_id: request.project}, cb);
      }
    }, function(err, result) {
      if (!err) {
        var from = result.user.firstName + " " + result.user.lastName + " | " + result.team.name + "<"+result.user.email+">";
        async.each(request.newInvitation, function(supplier,cb) {
          if (!supplier._id) {
            var packageInvite = new PackageInvite({
              owner: result.user.team._id,
              inviteType: 'supplier',
              project: result.project._id,
              package: request._id,
              to: supplier.email
            });
            packageInvite.save(function(err, saved){
              if (err) {return cb(err);}
              Mailer.sendMail('supplier-package-send-quote-no-account.html', from, saved.to, {
                materialPackage: request.toJSON(),
                team: result.team.toJSON(),
                user: result.user.toJSON(),
                project: result.project.toJSON(),
                registryLink : config.baseUrl + 'signup-invite?packageInviteToken=' + saved._id,
                subject: result.team.name + ' has sent you an addendum'
              },function(){
               return cb();
              });
            });
          }
          else {
            Team.findOne({_id: supplier._id}, function(err, team) {
              if (err || !team) {
                return cb(err);
              }
              async.each(team.leader, function(leader, callback) {
                User.findById(leader, function(err, user) {
                  if (err || !user) {
                    return callback(err);
                  }
                  Mailer.sendMail('supplier-package-send-quote.html', from, user.email, {
                    materialPackage: request.toJSON(),
                    //project owner
                    team: result.team.toJSON(),
                    user: result.user.toJSON(),
                    project: result.project.toJSON(),
                    link: config.baseUrl + result.project._id + '/material-request/' + request._id,
                    subject: result.team.name + ' has sent you an addendum'
                  }, function() {
                    return callback();
                  });
                });
              }, function() {
                return cb();
              });
            });
          }
        }, function() {
          return next();
        });
      } else {
        return next();
      }
    });
  }
  else {
    return next();
  }
});