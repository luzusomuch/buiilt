/**
 * Broadcast updates to client when the model changes
 */
var _ = require('lodash');
'use strict';

var Mailer = require('./../../components/Mailer');
var EventBus = require('./../../components/EventBus');
var Project = require('./../../models/project.model');
var User = require('./../../models/user.model');
var config = require('./../../config/environment');

/**
 * event handler after creating new quote
 */
EventBus.onSeries('Quote.Inserted', function(quote, next) {
  return next();
  Project.findById(quote.project, function(err, project) {
    if (err) {
      console.log(err);
    }
    else {
      User.findById(project.user._id, function(err, user) {
        if (err) {
          console.log(err);
        }
        else {
          Mailer.sendMail('quote-request.html', user.email, {
            quote: quote,
            user: user,
            project: project,
            quotesLink: config.baseUrl + 'quote',
            subject: 'Homebuilder send you a quote'
          }, next);
        }
      });
    }
  });
});