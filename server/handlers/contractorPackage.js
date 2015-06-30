'use strict';

var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var Project = require('./../models/project.model');
var ContractorPackage = require('./../models/contractorPackage.model');
var Team = require('./../models/team.model');
var Notification = require('./../models/notification.model');
var NotificationHelper = require('./../components/helpers/notification');
var _ = require('lodash');
var async = require('async');

EventBus.onSeries('ContractorPackage.Inserted', function(request, next) {
  _.each(request.to, function(toSupplier) {
    User.findOne({email: toSupplier.email}, function(err, user) {
      if (err || !user) {
        next();
      }
      var notification = new Notification({
        owner: user._id,
        fromUser: request._ownerUser,
        toUser: user._id,
        element: request,
        referenceTo: 'ContractorPackage',
        type: 'create-contractor-package'
      });
      notification.save(function(){
        next();
      });
    });
  });
});

EventBus.onSeries('ContractorPackage.Updated', function(request, next) {
  if (request._modifiedPaths.indexOf('sendQuote') != -1) {
    Team.findById(request.owner, function(err, team) {
      if (err || !team) {
        next();
      }
      else {
        async.each(team.leader, function(leader, cb) {
          var notification = new Notification({
            owner: leader,
            fromUser: request._editUser,
            toUser: leader,
            element: {package: request, quote: request._quote},
            referenceTo: 'SendQuote',
            type: 'send-quote'
          });
          notification.save(cb);
        }, function(){
          return next();
        });
      }
    });
  }
  else if (request._modifiedPaths.indexOf('inviteContractor') != -1) {
    async.parallel([
      function(cb){
        Team.findById(request.owner, function(err, team) {
          if (err || !team) {
            return cb();
          }
          else {
            async.each(team.leader, function(leader,cb) {
              var notification = new Notification({
                owner: leader,
                fromUser: request.ownerUser,
                toUser: leader,
                element: request,
                referenceTo: 'ContractorPackage',
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
        async.each(request.newInvitation, function(invite, callback) {
          if (invite._id) {
            Team.findById(invite._id, function(err, team) {
              if (err || !team) {
                return cb();
              }          
              else {
                async.each(team.leader, function(leader, cb) {
                  var notification = new Notification({
                    owner: leader,
                    fromUser: request.ownerUser,
                    toUser: leader,
                    element: request,
                    referenceTo: 'ContractorPackage',
                    type: 'invitation'
                  });
                  notification.save(cb);
                }, cb);
              }
            });
          } else {
            cb();
          }
        }, cb);
      }
    ])
  }
  else if (request._modifiedPaths.indexOf('sendAddendum') != -1) {
    async.each(request.to, function(toContractor, cb) {
      Team.findById(toContractor, function(err, team) {
        if (err) {
          return cb();
        }
        else {
          async.each(team.leader, function(leader, cb) {
            var notification = new Notification({
              owner: leader,
              fromUser: request.editUser,
              toUser: leader,
              element: request,
              referenceTo: 'ContractorPackage',
              type: 'send-addendum'
            });
            notification.save(cb);
          }, cb);
        }
      })
    }, function(){
      return next();
    });
  }
  else if (request._modifiedPaths.indexOf('editAddendum') != -1) {
    async.each(request.to, function(toContractor, cb) {
      if (toContractor._id) {
        Team.findById(toContractor, function(err, team) {
          if (err || !team) {
            return cb();
          }
          else {
            async.each(team.leader, function(leader,cb) {
              var notification = new Notification({
                owner: leader,
                fromUser: request.editUser,
                toUser: leader,
                element: request,
                referenceTo: 'ContractorPackage',
                type: 'edit-addendum'
              });
              notification.save(cb);
            }, cb);
          }
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
      if (err || !team) {
        next();
      }
      else {
        var params = {
          owners: team.leader,
          fromUser: request.ownerUser,
          element: request,
          referenceTo: 'ContractorPackage',
          type: 'send-message'
        };
        NotificationHelper.create(params, function(err) {
          if (err) {
            console.log(err);
          }
          next();
        });
      }
    });
  }
  else if (request._modifiedPaths.indexOf('sendMessageToBuilder') != -1) {
    Team.findById(request.owner, function(err, team) {
      if (err || !tema) {
        next();
      }
      else {
        var params = {
          owners: team.leader,
          fromUser: request.editUser,
          element: request,
          referenceTo: 'ContractorPackage',
          type: 'send-message-to-builder'
        };
        NotificationHelper.create(params, function(err) {
          if (err) {
            console.log(err);
          }
          next();
        });
      }
    });
  }
  else if (request._modifiedPaths.indexOf('selectQuote') != -1) {
    var notification = new Notification({
      owner: request.ownerUser,
      fromUser: request.editUser,
      toUser: request.ownerUser,
      element: request,
      referenceTo: 'ContractorPackage',
      type: 'select-quote'
    });
    notification.save();
  }
  else if (request._modifiedPaths.indexOf('sendDefect') != -1) {
    var owners = [];
    ContractorPackage.findById(request._id).populate('owner')
            .populate('winnerTeam._id').exec(function(err, contractorPackage) {
      if (err || !contractorPackage) {
        next();
      }
      else {
        owners = _.union(contractorPackage.owner.leader, contractorPackage.winnerTeam._id.leader);
        var params = {
          owners: owners,
          fromUser: request.editUser,
          element: request,
          referenceTo: 'ContractorPackage',
          type: 'send-defect'
        };
        NotificationHelper.create(params, function() {
          next();
        });
      }
    });
  }
  else if (request._modifiedPaths.indexOf('sendVariation') != -1) {
    var owners = [];
    ContractorPackage.findById(request._id).populate('owner')
            .populate('winnerTeam._id').exec(function(err, contractorPackage) {
      if (err || !contractorPackage) {
        next();
      }
      else {
        owners = _.union(contractorPackage.owner.leader, contractorPackage.winnerTeam._id.leader);
        var params = {
          owners: owners,
          fromUser: request.editUser,
          element: request,
          referenceTo: 'ContractorPackage',
          type: 'send-variation'
        };
        NotificationHelper.create(params, function() {
          next();
        });
      }
    });
  }
  else if (request._modifiedPaths.indexOf('sendInvoice') != -1) {
    var owners = [];
    ContractorPackage.findById(request._id).populate('owner')
            .populate('winnerTeam._id').exec(function(err, contractorPackage) {
      if (err || !contractorPackage) {
        next();
      }else {
        owners = _.union(contractorPackage.owner.leader, contractorPackage.winnerTeam._id.leader);
        var params = {
          owners: owners,
          fromUser: request.editUser,
          element: request,
          referenceTo: 'ContractorPackage',
          type: 'send-invoice'
        };
        NotificationHelper.create(params, function() {
          next();
        });
      }
    });
  }
});