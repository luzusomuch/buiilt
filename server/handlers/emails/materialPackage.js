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
    project: function(cb) {
      //find project
      Project.findOne({_id: request.project}, cb);
    }
  }, function(err, result) {
    if (err) {
      return next();
    }
    async.each(request.to, function(supplier, cb) {
      if (!supplier._id) {
        var packageInvite = new PackageInvite({
          owner: result.user._id,
          inviteType: 'supplier',
          project: result.project._id,
          package: request._id,
          to: supplier.email
        });
        packageInvite.save(function(err, saved){
          if (err) {return cb(err);}
          else {
            Mailer.sendMail('supplier-package-send-quote-no-account.html', saved.to, {
              materialPackage: request,
              user: result.user,
              project: result.project,
              registryLink : config.baseUrl + 'signup-invite?packageInviteToken=' + saved._id,
              subject: 'Invite supplier send quote for ' + request.name
            },function(err){
             return cb(err);
            });
          }
        });
      }
      else {
        Team.findOne({_id: supplier._id}, function(err, team) {
          if (err || !team) {
            return cb(err);
          }
          else {
            async.each(team.leader, function(leader, callback) {
              User.findById(leader, function(err, user) {
                if (err || !user) {
                  return callback(err);
                }
                else {
                  Mailer.sendMail('supplier-package-send-quote.html', user.email, {
                    materialPackage: request,
                    //project owner
                    user: result.user,
                    project: result.project,
                    link: config.baseUrl + result.project._id + '/material-request/' + request._id,
                    subject: 'Quote request for ' + request.name
                  }, function() {
                    return callback();
                  });
                }
              });
            }, function() {
              return cb();
            });
          }
        });
      }
    }, function(){
      return next();
    });
  });
});

EventBus.onSeries('MaterialPackage.Updated', function(request, next) {
  if (request._modifiedPaths.indexOf('inviteMaterial') != -1) {
    async.parallel({
      user: function(cb) {
        User.findOne({_id: request.editUser._id}, cb);
      },
      project: function(cb) {
        //find project
        Project.findOne({_id: request.project}, cb);
      }
    }, function(err, result) {
      if (!err) {
        async.each(request.newInvitation, function(supplier,cb) {
          if (!supplier._id) {
            var packageInvite = new PackageInvite({
              owner: result.user._id,
              inviteType: 'supplier',
              project: result.project._id,
              package: request._id,
              to: supplier.email
            });
            packageInvite.save(function(err, saved){
              if (err) {return cb(err);}
              else {
                Mailer.sendMail('supplier-package-send-quote-no-account.html', saved.to, {
                  materialPackage: request,
                  user: result.user,
                  project: result.project,
                  registryLink : config.baseUrl + 'signup-invite?packageInviteToken=' + saved._id,
                  subject: 'Invite supplier send quote for ' + request.name
                },function(err){
                 return cb(err);
                });
              }
            });
          }
          else {
            Team.findOne({_id: supplier._id}, function(err, team) {
              if (err || !team) {
                return cb(err);
              }else {
                async.each(team.leader, function(leader, callback) {
                  User.findById(leader, function(err, user) {
                    if (err || !user) {
                      return callback(err);
                    }
                    else {
                      Mailer.sendMail('supplier-package-send-quote.html', user.email, {
                        materialPackage: request,
                        //project owner
                        user: result.user,
                        project: result.project,
                        link: config.baseUrl + result.project._id + '/material-request/' + request._id,
                        subject: 'Quote request for ' + request.name
                      }, function() {
                        return callback();
                      });
                    }
                  });
                }, function() {
                  return cb();
                });
              }
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