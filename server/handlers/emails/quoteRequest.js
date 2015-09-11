/**
 * Broadcast updates to client when the model changes
 */
var _ = require('lodash');
'use strict';

var Mailer = require('./../../components/Mailer');
var EventBus = require('./../../components/EventBus');
var Team = require('./../../models/team.model');
var Project = require('./../../models/project.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var ContractorPackage = require('./../../models/contractorPackage.model');
var User = require('./../../models/user.model');
var config = require('./../../config/environment');
var async = require('async');

/**
 * event handler after creating new quote
 */
EventBus.onSeries('QuoteRequest.Updated', function(request, next) {
  async.parallel({
    user: function(cb){
      User.findOne({_id: request.user}, cb);
    },
    project: function(cb){
      //find project
      Project.findOne({_id: request.project}, cb);
    },
    builderPackage: function(cb){
      BuilderPackage.findOne({_id: request.package}, cb);
    },
    contractorPackage: function(cb){
      ContractorPackage.findOne({_id: request.package}, cb);
    }
  }, function(err, result){
    if (!err) {
      if (result.builderPackage) {
        Mailer.sendMail('become-home-builder.html',config.emailFrom, result.project.builder.email, {
          //project owner
          user: result.user.toJSON(),
          project: result.project.toJSON(),
          link: config.baseUrl + request.project +'/dashboard',
          builderPackage: result.builderPackage.toJSON(),
          subject: 'Join your project, ' + result.project.name + ', on buiilt.'
        }, function() {
          return next();
        });
      } else {
        return next();
      }
    } else {
      return next();
    }
  });
});


EventBus.onSeries('QuoteRequest.Inserted', function(request, next) {
  async.parallel({
    user: function(cb){
      User.findOne({_id: request.user}, cb);
    },
    project: function(cb){
      //find project
      Project.findOne({_id: request.project}, cb);
    },
    builderPackage: function(cb){
      BuilderPackage.findOne({_id: request.package}, cb);
    },
    contractorPackage: function(cb){
      ContractorPackage.findOne({_id: request.package}, cb);
    }
  }, function(err, result){
    if (!err) {
      return next();
      //do send email
      // if (result.builderPackage) {
      //   Mailer.sendMail('builder-quote-request.html', result.project.user.email, {
      //     quoteRequest: request,
      //     //project owner
      //     user: result.user,
      //     price: request.price,
      //     project: result.project,
      //     quotesLink: config.baseUrl + 'quote-requests/' + request._id,
      //     builderPackage: result.builderPackage,
      //     subject: 'Quote request for ' + result.builderPackage.name
      //   }, function() {
      //     return next();
      //   });
      // } else if (result.contractorPackage) {
      //   Team.findById(result.contractorPackage.owner).populate('leader').exec(function(err, team) {
      //     if (err || !team) {return next();}
      //     else {
      //       async.each(team.leader, function(leader, cb){
      //         Mailer.sendMail('view-quote-contractor-package.html', leader.email, {
      //           quoteRequest: request,
      //           //project owner
      //           user: result.user,
      //           price: request.price,
      //           // description: request.description,
      //           project: result.project,
      //           quotesLink: config.baseUrl + 'contractor-requests/' + result.contractorPackage._id + '/view',
      //           contractorPackage: result.contractorPackage,
      //           subject: 'View quote request for contractor package' + result.contractorPackage.name
      //         }, function() {
      //           return cb();
      //         });
      //       }, function(){
      //         return next();
      //       });
      //     }
      //   });
      // } else {
      //   return next();
      // }
    } else {
      return next();
    }
  });
});