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
var ContractorPackage = require('./../../models/contractorPackage.model');
var PackageInvite = require('./../../models/packageInvite.model');
var config = require('./../../config/environment');
var async = require('async');

/**
 * event handler after creating new quote
 */
 //contractor-package-request.html
EventBus.onSeries('ContractorPackage.Inserted', function(request, next) {
  async.parallel({
    user: function(cb){
      User.findOne({_id: request.owner}, cb);
    },
    project: function(cb){
      //find project
      Project.findOne({_id: request.project}, cb);
    }
  }, function(err, result){
    if (!err) {
      //do send email
      async.each(request.to,function(toEmail,cb) {
        if (!toEmail._id) {
          return cb();
        }
        else {
          Team.findOne({'_id': toEmail._id}, function(err, team) {
          if (err || !team) {return cb();}
          else {
            async.each(team.leader, function(leader, callback) {
              User.findById(leader, function(err,user) {
                Mailer.sendMail('contractor-package-request.html', user.email, {
                  contractorPackage: request,
                  //project owner
                  user: result.user,
                  project: result.project,
                  contractorPackageLink: config.baseUrl + result.project._id  + '/contractor-requests/' + request._id,
                  subject: 'Quote request for ' + request.name
                }, function() {
                  return callback();
                });
              });
            }, function(){
              return cb();
            });
          }
        });
        }
      }, function(){
        return next();
      });
    } else {
      return next();
    }
  });
});

EventBus.onSeries('ContractorPackage.Updated', function(request, next) {
  async.parallel({
    user: function(cb){
      User.findOne({_id: request.owner}, cb);
    },
    project: function(cb){
      //find project
      Project.findOne({_id: request.project}, cb);
    }
  }, function(err, result){
    if (!err) {
      //do send email
      async.each(request.newInvitation,function(toEmail, cb) {
        if (!toEmail._id) {
          return next();
        }
        else {
          Team.findOne({'_id': toEmail._id}, function(err, team) {
          if (err || !team) {return cb();}
          else {
            async.each(team.leader, function(leader, callback) {
              User.findById(leader, function(err,user) {
                if (err || !user) {return cb();}
                Mailer.sendMail('contractor-package-request.html', user.email, {
                  contractorPackage: request,
                  //project owner
                  user: result.user,
                  project: result.project,
                  contractorPackageLink: config.baseUrl + 'contractor-requests/' + request._id,
                  subject: 'Quote request for ' + request.name
                }, function() {
                  return callback();
                });
              });
            }, function(){
              return cb();
            });
          }
        });
        }
      }, function(){
        return next();
      });
    } else {
      return next();
    }
  });
});