/**
 * Broadcast updates to client when the model changes
 */
var _ = require('lodash');
'use strict';

var Mailer = require('./../../components/Mailer');
var EventBus = require('./../../components/EventBus');
var Project = require('./../../models/project.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var User = require('./../../models/user.model');
var config = require('./../../config/environment');
var async = require('async');

/**
 * event handler after creating new quote
 */
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
    }
  }, function(err, result){
    if (!err) {
      //do send email
      Mailer.sendMail('builder-quote-request.html', request.email, {
        quoteRequest: request,
        //project owner
        user: result.user,
        project: result.project,
        quotesLink: config.baseUrl + 'quote-request/' + request._id,
        buidlerPackage: result.builderPackage,
        subject: 'Quote request for ' + result.builderPackage.name
      }, function(err) {
        return next();
      });
    } else {
      return next();
    }
  });
});