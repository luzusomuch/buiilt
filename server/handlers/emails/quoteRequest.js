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
EventBus.onSeries('QuoteRequest.Inserted', function(request, next) {
  console.log(request);
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
      console.log(result);
      //do send email
      Mailer.sendMail('builder-quote-request.html', request.email, {
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
    } else {
      return next();
    }
  });
  // console.log(request);
  // Project.findOne({_id: request.project}, function(err, project) {
  //   if (err) {console.log(err);}
  //   else {
  //     BuilderPackage.findOne({_id: request.package}, function(err, pack) {
  //       if (err) {console.log(err);}
  //       else {
  //         Mailer.sendMail('builder-quote-request.html', request.email, {
  //         quoteRequest: request,
  //         project: project,
  //         builderPackage: pack,
  //         quotesLink: config.baseUrl + 'quote-requests/' + request._id,
  //         subject: 'Quote request for ' + pack.name
  //       },function(){});
  //       }
  //     });
  //   }
  // });
});