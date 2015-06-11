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
      _.each(request.to,function(toEmail) {
        Team.findOne({$or: [{'leader': toEmail._id}, {'member._id': toEmail._id}]}, function(err, team) {
          if (err) {return console.log(err);}
          if (!team) {
            Mailer.sendMail('contractor-package-request.html', toEmail.email, {
              contractorPackage: request,
              //project owner
              user: result.user,
              project: result.project,
              contractorPackageLink: config.baseUrl + 'contractor-requests/' + request._id,
              subject: 'Quote request for ' + request.name
            }, function(err) {
              return next();
            });
          }
          else {
            console.log(team);
            async.each(team.leader, function(leader, callback) {
              User.findById(leader, function(err,user) {
                Mailer.sendMail('contractor-package-request.html', user.email, {
                  contractorPackage: request,
                  //project owner
                  user: result.user,
                  project: result.project,
                  contractorPackageLink: config.baseUrl + 'contractor-requests/' + request._id,
                  subject: 'Quote request for ' + request.name
                }, function(err) {
                  return next();
                });
              });
            }, function(err){
              return next();
            });
          }
        });
      });
    } else {
      return next();
    }
  });
});