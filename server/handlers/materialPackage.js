'use strict';

var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var Project = require('./../models/project.model');
var MaterialPackage = require('./../models/materialPackage.model');
var Team = require('./../models/team.model');
var Notification = require('./../models/notification.model');
var NotificationHelper = require('./../components/helpers/notification');
var _ = require('lodash');
var async = require('async');

EventBus.onSeries('MaterialPackage.Inserted', function(request, next) {
    async.each(request.to, function(toSupplier, cb){
        User.findOne({email: toSupplier.email}, function(err, user){
            if (err || !user) {return cb(err);}
            else {
                var notification = new Notification({
                    owner: user._id,
                    fromUser: request._ownerUser,
                    toUser: user._id,
                    element: request,
                    referenceTo: 'MaterialPackage',
                    type: 'create-material-package'
                });
                notification.save(cb);
                console.log(notification);
            }
        });
    }, function(){
      return next();
    });
});

EventBus.onSeries('MaterialPackage.Updated', function(request, next) {
    if (request._modifiedPaths.indexOf('sendQuote') != -1) {
        Team.findById(request.owner, function(err, team) {
          if (err || !team) {next(); }
          else {
            async.each(team.leader, function(leader, cb) {
              var notification = new Notification({
                owner: leader,
                fromUser: request._editUser,
                toUser: leader,
                element: {package: request, quote: request._quote},
                referenceTo: 'MaterialPackage',
                type: 'send-quote'
              });
              notification.save(cb);
            }, function(){
              return next();
            });
          }
        });
    } else if (request._modifiedPaths.indexOf('inviteMaterial') != -1) {
      async.parallel([
        function(cb){
          Team.findById(request.owner, function(err, team) {
            if (err || !team) { return cb(err); }
            else {
              async.each(team.leader, function(leader, cb) {
                var notification = new Notification({
                  owner: leader,
                  fromUser: request.ownerUser,
                  toUser: leader,
                  element: {package:request},
                  referenceTo: 'MaterialPackage',
                  type: 'invite'
                });
                notification.save(cb);
              }, function(){
                return cb();
              });
            }
          });
        },
        function(cb){
          async.each(request.newInvitation, function(invite, cb) {
            if (invite._id) {
              Team.findById(invite._id, function(err, team) {
                if (err || !team) { return cb(); }

                async.each(team.leader, function(leader, cb) {
                  var notification = new Notification({
                    owner: leader,
                    fromUser: request.ownerUser,
                    toUser: leader,
                    element: request,
                    referenceTo: 'MaterialPackage',
                    type: 'invitation'
                  });
                  notification.save(cb);
                }, cb);
              });
            } else {
              return cb();
            }
          }, cb);
        }
      ], function(){
        return next();
      });
    }else if (request._modifiedPaths.indexOf('sendAddendum') != -1) {
        async.each(request.to, function(toContractor, cb) {
          Team.findById(toContractor, function(err, team) {
            if (err || !team) { return cb(); }
            async.each(team.leader, function(leader, cb) {
              var notification = new Notification({
                owner: leader,
                fromUser: request.editUser,
                toUser: leader,
                element: request,
                referenceTo: 'MaterialPackage',
                type: 'send-addendum'
              });
              notification.save(cb);
            }, cb);
          });
        }, function(){
          return next();
        });
    }
    else if (request._modifiedPaths.indexOf('decline-quote') != -1) {
      var notification = new Notification({
        owner: request.ownerUser,
        fromUser: request.editUser._id,
        toUser: request.ownerUser,
        element: {package:request},
        referenceTo: 'MaterialPackage',
        type: 'decline-quote'
      });
      notification.save();
    }
    else if (request._modifiedPaths.indexOf('editAddendum') != -1) {
        async.each(request.to, function(toContractor,cb) {
          if (toContractor._id) {
            Team.findById(toContractor, function(err, team) {
                if (err || !team) {
                    return cb();
                }
                async.each(team.leader, function(leader,cb) {
                    var notification = new Notification({
                    owner: leader,
                    fromUser: request.editUser,
                    toUser: leader,
                    element: request,
                    referenceTo: 'MaterialPackage',
                    type: 'edit-addendum'
                });
                notification.save(cb);
            }, cb);
            });
          }
          else {
            return cb();
          }
        }, function(){
            return next();
        });
    }
    else if (request._modifiedPaths.indexOf('sendMessage') != -1) {
        Team.findById(request.editUser, function(err, team) {
            if (err || !team) {next();}
            var params = {
              owners: team.leader,
              fromUser: request.ownerUser,
              element: request,
              referenceTo: 'MaterialPackage',
              type: 'send-message'
            };
            NotificationHelper.create(params, function() {
              next();
            });
        });
    }
    else if (request._modifiedPaths.indexOf('cancel-package') != -1) {
      async.each(request.to, function(toMaterial, callback){
        if (toMaterial._id) {
          Team.findById(toMaterial._id, function(err, team){
            if (err || !team) {return callback();}
            var params = {
              owners: team.leader,
              fromUser: request.editUser._id,
              element: {package:request},
              referenceTo: 'MaterialPackage',
              type: 'cancel-package'
            };
            NotificationHelper.create(params, function() {
              return callback();
            });
          })
        }
        else {
          return callback();
        }
      });
    }
    else if (request._modifiedPaths.indexOf('sendMessageToBuilder') != -1) {
        Team.findById(request.owner, function(err, team) {
            if (err) {next();}
            var params = {
              owners: team.leader,
              fromUser: request.editUser,
              element: {package:request},
              referenceTo: 'MaterialPackage',
              type: 'send-message-to-builder'
            };
            NotificationHelper.create(params, function() {
              next();
            });
        });
    }
    else if (request._modifiedPaths.indexOf('selectQuote') != -1) {
        
      async.parallel([
        function(cb) {
          var notification = new Notification({
            owner: request.ownerUser,
            fromUser: request.editUser,
            toUser: request.ownerUser,
            element: request,
            referenceTo: 'MaterialPackage',
            type: 'select-quote'
          });
          notification.save(function(){
              next();
          });
        },
        function(cb) {
          _.remove(request.to, {_id: request.winnerTeam._id});
          _.each(request.to, function(toSupplierLoser){
            if (!toContractorLoser._id) {
              return cb();
            }
            Team.findById(toSupplierLoser._id, function(err, team){
              if (err || !team) {return cb();}
              var params = {
                owners: team.leader,
                fromUser: request.editUser,
                element: {package:request},
                referenceTo: 'MaterialPackage',
                type: 'send-thanks-to-loser'
              };
              NotificationHelper.create(params, function() {
                next();
              });
            })
          });
        }
      ],function(){
        return next();
      });
    }
    else if (request._modifiedPaths.indexOf('sendDefect') != -1) {
        var owners = [];
        MaterialPackage.findById(request._id).populate('owner')
            .populate('winnerTeam._id').exec(function(err, MaterialPackage) {
            if (err || !MaterialPackage) {next();}
            owners = _.union(MaterialPackage.owner.leader, MaterialPackage.winnerTeam._id.leader);
            var params = {
              owners: owners,
              fromUser: request.editUser,
              element: request,
              referenceTo: 'MaterialPackage',
              type: 'send-defect'
            };
            NotificationHelper.create(params, function() {
              next();
            });
        });
    }
    else if (request._modifiedPaths.indexOf('sendVariation') != -1) {
        var owners = [];
        MaterialPackage.findById(request._id).populate('owner')
            .populate('winnerTeam._id').exec(function(err, MaterialPackage) {
            if (err || !MaterialPackage) {next();}
            owners = _.union(MaterialPackage.owner.leader, MaterialPackage.winnerTeam._id.leader);
            var params = {
              owners: owners,
              fromUser: request.editUser,
              element: request,
              referenceTo: 'MaterialPackage',
              type: 'send-variation'
            };
            NotificationHelper.create(params, function() {
              next();
            });
        });
    }
    else if (request._modifiedPaths.indexOf('sendInvoice') != -1) {
        var owners = [];
        MaterialPackage.findById(request._id).populate('owner')
            .populate('winnerTeam._id').exec(function(err, MaterialPackage) {
            if (err || !MaterialPackage) {next();}
            owners = _.union(MaterialPackage.owner.leader, MaterialPackage.winnerTeam._id.leader);
            var params = {
              owners: owners,
              fromUser: request.editUser,
              element: request,
              referenceTo: 'MaterialPackage',
              type: 'send-invoice'
            };
            NotificationHelper.create(params, function() {
              next();
            });
        });
    }
    else {
        return next();
    }
});