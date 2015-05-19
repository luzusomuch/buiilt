/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var Project = require('./../models/project.model');
var BuilderPackage = require('./../models/builderPackage.model');
var Mailer = require('./../components/Mailer');
var _ = require('lodash');
var async = require('async');

/**
 * event handler after creating new account
 */
EventBus.onSeries('BuilderPackage.Inserted', function(builderPackage, next) {
  //find requestedHomeBuilders then send email
  Project.findOne({
    _id: builderPackage.project
  }, function(err, project){
    if(!err){
      //find required home builder then send email
      async.each(project.requestedHomeBuilders, function(homeBuilder, cb){
        User.findOne({
          $or: [
            {email: homeBuilder.email},
            {phoneNumber: homeBuilder.phoneNumber}
          ]
        }, function(err, user){
          if(err){ return cb(err); }

          //do send email
          if(!user && homeBuilder.email){
            //send email to create new account
            Mailer.sendMail('invite-home-builder-send-quote-no-account.html', homeBuilder.email, {
              project: project,
              package: builderPackage,
              subject: 'Send a quote from buiilt.com'
            }, function(err){
            });
          }else{
            Mailer.sendMail('invite-home-builder-send-quote-has-account.html', user.email, {
              user: user,
              project: project,
              package: builderPackage,
              subject: 'Send a quote from buiilt.com'
            }, function(err){
            });
          }
        });
      }, function(err){
        return next();
      });
    }else{
      next();
    }
  });
});