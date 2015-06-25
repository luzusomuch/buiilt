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
var config = require('./../../config/environment');
var async = require('async');

/**
 * event handler after creating new quote
 */
 //contractor-package-request.html
EventBus.onSeries('MaterialPackage.Inserted', function(request, next) {
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
      _.each(request.to, function(supplier) {
        if (!supplier._id) {
          return next();
        }
        else {
          Team.findOne({_id: supplier._id}, function(err, team) {
            if (err) {return next();}
            if (!team) {return next();}
            else {
              async.each(team.leader, function(leader, callback) {
                User.findById(leader, function(err,user) {
                  if (err) {return next();}
                  else {
                    Mailer.sendMail('supplier-package-send-quote.html', user.email, {
                      materialPackage: request,
                      //project owner
                      user: result.user,
                      project: result.project,
                      link: config.baseUrl + result.project._id + '/material-request/' + request._id,
                      subject: 'Quote request for ' + request.name
                    }, function(err) {
                      console.log(err);
                      return next();
                    });
                  }
                });
                callback();
              }, function(err){
                return next();
              }); 
            }
          });
        }
      });
    } else {
      return next();
    }
  });
});

EventBus.onSeries('MaterialPackage.Updated', function(request, next) {
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
      _.each(request.newInvitation, function(supplier) {
        if (!supplier._id) {
          // PackageInvite.find({package: request._id}, function(err, packageInvites){
          //   if (err) {return next();}
          //   if (!packageInvites) {return next();}
          //   else {
          //     _.each(packageInvites, function(packageInvite){
          //       Mailer.sendMail('supplier-package-send-quote-no-account.html', packageInvite.to, {
          //         materialPackage: request,
          //         //project owner
          //         user: result.user,
          //         project: result.project,
          //         registryLink: config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
          //         link: config.baseUrl + result.project._id +  '/material-request/' + request._id,
          //         subject: 'Quote request for ' + request.name
          //       }, function(err) {
          //         console.log(err);
          //         return next();
          //       });
          //     });
          //   }
          // });
          return next();
        }
        else {
          Team.findOne({_id: leader._id}, function(err, team) {
            if (err) {return res.send(500,err);}
            if (!team) {return next();}
            else {
              async.each(team.leader, function(leader, callback) {
                User.findById(leader, function(err,user) {
                  Mailer.sendMail('supplier-package-send-quote.html', user.email, {
                    materialPackage: request,
                    //project owner
                    user: result.user,
                    project: result.project,
                    link: config.baseUrl + result.project._id + '/material-request/' + request._id,
                    subject: 'Quote request for ' + request.name
                  }, function(err) {
                    console.log(err);
                    return next();
                  });
                });
              }, function(err){
                console.log(err);
                return next();
              }); 
            }
          });
        }
      });
    } else {
      return next();
    }
  });
});