/**
 * Broadcast updates to client when the model changes
 */
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
        Mailer.sendMail('become-home-builder.html', result.project.builder.email, {
          //project owner
          user: result.user,
          project: result.project,
          link: config.baseUrl + request.project +'/dashboard',
          builderPackage: result.builderPackage,
          subject: 'Become home builder for project ' + result.project.name
        }, function(err) {
          return next();
        });
      }
      else if(result.contractorPackage) {
        console.log(result.contractorPackage);
      }
    }
    else {
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
      //do send email
      if (result.builderPackage) {
        Mailer.sendMail('builder-quote-request.html', result.project.user.email, {
          quoteRequest: request,
          //project owner
          user: result.user,
          price: request.price,
          project: result.project,
          quotesLink: config.baseUrl + 'quote-requests/' + request._id,
          builderPackage: result.builderPackage,
          subject: 'Quote request for ' + result.builderPackage.name
        }, function(err) {
          return next();
        });
      }
      else if (result.contractorPackage) {
        User.findOne({_id:result.contractorPackage.owner}, function(err, user) {
          Mailer.sendMail('view-quote-contractor-package.html', user.email, {
            quoteRequest: request,
            //project owner
            user: result.user,
            price: request.price,
            description: request.description,
            project: result.project,
            quotesLink: config.baseUrl + 'contractor-requests/' + result.contractorPackage._id + '/view',
            contractorPackage: result.contractorPackage,
            subject: 'View quote request for contractor package' + result.contractorPackage.name
          }, function(err) {
            console.log(err);
            return next();
          });
        });
      }
    } else {
      return next();
    }
  });
});