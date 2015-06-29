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
var Notification = require('./../../models/notification.model');
var NotificationHelper = require('./../../components/helpers/notification');
var config = require('./../../config/environment');
var async = require('async');

/**
 * event handler after creating new quote
 */
//contractor-package-request.html
EventBus.onSeries('MaterialPackage.Inserted', function(request, next) {
  async.parallel({
    user: function(cb) {
      User.findOne({_id: request.owner}, cb);
    },
    project: function(cb) {
      //find project
      Project.findOne({_id: request.project}, cb);
    }
  }, function(err, result) {
    if (err) {
      return next();
    }

    async.each(request.to, function(supplier, cb) {
      if (!supplier._id) {
        return cb();
      }
      else {
        Team.findOne({_id: supplier._id}, function(err, team) {
          if (err) {
            return cb();
          }
          if (!team) {
            return cb();
          }
          else {
            async.each(team.leader, function(leader, callback) {
              User.findById(leader, function(err, user) {
                if (err) {
                  return callback();
                }
                if (!user) {
                  return callback();
                }
                else {
                  Mailer.sendMail('supplier-package-send-quote.html', user.email, {
                    materialPackage: request,
                    //project owner
                    user: result.user,
                    project: result.project,
                    link: config.baseUrl + result.project._id + '/material-request/' + request._id,
                    subject: 'Quote request for ' + request.name
                  }, function() {
                    return callback();
                  });
                }
              });
            }, function() {
              return cb();
            });
          }
        });
      }
    });
  });
});

EventBus.onSeries('MaterialPackage.Updated', function(request, next) {
  if (request._modifiedPaths.indexOf('sendQuote') != -1) {
    Team.findById(request.owner, function(err, team) {
      if (err || !team) { return next(); }
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
  } else if (request._modifiedPaths.indexOf('inviteMaterial') != -1) {
    async.parallel([
      function(cb){
        Team.findById(request.owner, function(err, team) {
          if (err || team) { return cb(); }
          else {
            async.each(team.leader, function(leader, cb) {
              var notification = new Notification({
                owner: leader,
                fromUser: request.ownerUser,
                toUser: leader,
                element: request,
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
  else if (request._modifiedPaths.indexOf('editAddendum') != -1) {
    _.each(request.to, function(toContractor) {
      if (toContractor._id) {
        Team.findById(toContractor, function(err, team) {
          if (err) {
            return next();
          }
          if (!team) {
            return next();
          }
          else {
            _.each(team.leader, function(leader) {
              var notification = new Notification({
                owner: leader,
                fromUser: request.editUser,
                toUser: leader,
                element: request,
                referenceTo: 'MaterialPackage',
                type: 'edit-addendum'
              });
              notification.save();
            });
          }
        });
      }
      else {
        return next();
      }
    });
  }
  else if (request._modifiedPaths.indexOf('sendMessage') != -1) {
    Team.findById(request.editUser, function(err, team) {
      if (err) {
        return next();
      }
      if (!team) {
        return next();
      }
      else {
        var params = {
          owners: team.leader,
          fromUser: request.ownerUser,
          element: request,
          referenceTo: 'MaterialPackage',
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
      if (err) {
        return next();
      }
      if (!team) {
        return next();
      }
      else {
        var params = {
          owners: team.leader,
          fromUser: request.editUser,
          element: request,
          referenceTo: 'MaterialPackage',
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
      referenceTo: 'MaterialPackage',
      type: 'select-quote'
    });
    notification.save();
  }
  else if (request._modifiedPaths.indexOf('sendDefect') != -1) {
    var owners = [];
    MaterialPackage.findById(request._id).populate('owner')
            .populate('winnerTeam._id').exec(function(err, MaterialPackage) {
      if (err) {
        return next();
      }
      if (!MaterialPackage) {
        return next();
      }
      else {
        owners = _.union(MaterialPackage.owner.leader, MaterialPackage.winnerTeam._id.leader);
        var params = {
          owners: owners,
          fromUser: request.editUser,
          element: request,
          referenceTo: 'MaterialPackage',
          type: 'send-defect'
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
  else if (request._modifiedPaths.indexOf('sendVariation') != -1) {
    var owners = [];
    MaterialPackage.findById(request._id).populate('owner')
            .populate('winnerTeam._id').exec(function(err, MaterialPackage) {
      if (err) {
        return next();
      }
      if (!MaterialPackage) {
        return next();
      }
      else {
        owners = _.union(MaterialPackage.owner.leader, MaterialPackage.winnerTeam._id.leader);
        var params = {
          owners: owners,
          fromUser: request.editUser,
          element: request,
          referenceTo: 'MaterialPackage',
          type: 'send-variation'
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
  else if (request._modifiedPaths.indexOf('sendInvoice') != -1) {
    var owners = [];
    MaterialPackage.findById(request._id).populate('owner')
            .populate('winnerTeam._id').exec(function(err, MaterialPackage) {
      if (err) {
        return next();
      }
      if (!MaterialPackage) {
        return next();
      }
      else {
        owners = _.union(MaterialPackage.owner.leader, MaterialPackage.winnerTeam._id.leader);
        var params = {
          owners: owners,
          fromUser: request.editUser,
          element: request,
          referenceTo: 'MaterialPackage',
          type: 'send-invoice'
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
  async.parallel({
    user: function(cb) {
      User.findOne({_id: request.owner}, cb);
    },
    project: function(cb) {
      //find project
      Project.findOne({_id: request.project}, cb);
    }
  }, function(err, result) {
    if (!err) {
      _.each(request.newInvitation, function(supplier) {
        if (!supplier._id) {
          return next();
        }
        else {
          Team.findOne({_id: supplier._id}, function(err, team) {
            if (err) {
              return next();
            }
            if (!team) {
              return next();
            }
            else {
              async.each(team.leader, function(leader, callback) {
                User.findById(leader, function(err, user) {
                  if (err) {
                    return next();
                  }
                  if (!user) {
                    return next();
                  }
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
              }, function(err) {
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