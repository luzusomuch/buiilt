'use strict';

var User = require('./../../../models/user.model');
var Team = require('./../../../models/team.model');
var Project = require('./../../../models/project.model');
var BuilderPackage = require('./../../../models/builderPackage.model');
var BuilderPackageNewVersion = require('./../../../models/builderPackageNew.model');
var errorsHelper = require('./../../../components/helpers/errors');
var ProjectValidator = require('./../../../validators/project');
var _ = require('lodash');
var async = require('async');
var EventBus = require('./../../../components/EventBus');
var mongoose = require('mongoose');

exports.project = function(req, res, next) {
  Project.findById(req.params.id,function(err,project) {
    if (err) {
      return res.send(500,{msg: 'Missing project.'})
    }
    if (!project) {
      return res.send(404,err);
    }
    req.project = project;
    next();
  })
};

exports.getDefaultPackageByProject = function(req, res) {
  var user = req.user;
  var project = req.project;
  BuilderPackageNewVersion.findOne({
    project: mongoose.Types.ObjectId(project._id)
  })
  .populate('project')
  .populate('owner')
  .populate('to.team')
  .populate('variations')
  .populate('messages.sendBy')
  .populate('winner')
  .populate('architect.team')
  .populate('invitees.quoteDocument', '_id mimeType title')
  .exec(function(err, builderPackage) {
    if (err){console.log(err); return res.send(500, err); }
    console.log(builderPackage);
    User.populate(builderPackage,[
      {path : 'owner.member._id'},
      {path : 'owner.leader'},
      {path : 'to.team.member._id'},
      {path : 'to.team.leader'},
      {path : 'architect.team.leader'},
      {path : 'architect.team.member._id'},
      {path : 'winner.leader'},
      {path : 'winner.member._id'}
    ],function(err,builderPackage) {
      if (err){ console.log(err);return res.send(500, err); }
      if (builderPackage.hasArchitectManager && builderPackage.architect.team) {
        if (builderPackage.architect.team._id.toString() == user.team._id.toString()) {
          return res.json(builderPackage);
        } else {
          var messagesFiltered = [];
          _.each(builderPackage.messages, function(message){
            if (message.to.toString() == user.team._id.toString()) {
              messagesFiltered.push(message);
            }
          });
          builderPackage.messages = [];
          builderPackage.messages = messagesFiltered;
          return res.json(builderPackage);
        }
      } else {
        var messagesFiltered = [];
        _.each(builderPackage.messages, function(message){
          if (message.to.toString() == user.team._id.toString()) {
            messagesFiltered.push(message);
          }
        });
        builderPackage.messages = [];
        builderPackage.messages = messagesFiltered;
        return res.json(builderPackage);
      }
    });
  });
};

/**
 * get single package id
 */
exports.findByProject = function(req, res){
  BuilderPackage.findOne({project: req.params.id})
  .populate('project')
  .populate('owner')
  .populate('to.team')
  .populate('variations')
  .exec(function(err, builderPackage) {
    if (err){ return res.send(500, err); }
    if (!builderPackage) {return res.send(404, err);}
    User.populate(builderPackage,[
      {path : 'owner.member._id'},
      {path : 'owner.leader'},
      {path : 'to.team.member._id'},
      {path : 'to.team.leader'}
    ],function(err,builderPackage) {
      if (err){ console.log(err);return res.send(500, err); }
      return res.json(builderPackage);
    });
  });
};

exports.getAll = function(req, res){
  BuilderPackage.find({}, function(err, builderPackages){
    if (err) {return res.send(500,err);}
    return res.send(200,builderPackages);
  })
};

exports.destroy = function (req, res) {
  BuilderPackage.findByIdAndRemove(req.params.id, function (err, builderPackage) {
    if (err) {
      return res.send(500, err);
    }
    BuilderPackage.find({}, function(err,builderPackages){
      if (err) {return res.send(500,err);}
      return res.send(200, builderPackages);
    })
  });
};

exports.updatePackage = function(req, res) {
  var requestPackage = req.body.package;
  BuilderPackage.update({_id: req.params.id},
  {name: requestPackage.name, descriptions: requestPackage.descriptions}, function(err, saved) {
    if (err) {return res.send(500,err);}
    return res.send(200,saved);
  })
};

exports.inviteBuilder = function(req, res) {
  BuilderPackage.findById(req.params.id, function(err, builderPackage){
    if (err) {return res.send(500,err);}
    if (!builderPackage) {return res.send(404);}
    var newInvitees = [];
    var invitees = builderPackage.invitees;
    async.each(req.body.toBuilder, function(builder, cb){
      User.findOne({email: builder.email}, function(err, user){
        if (err) {return cb(err);}
        if (!user) {
          invitees.push({
            email: builder.email,
            phoneNumber: builder.phoneNumber
          });
          newInvitees.push({
            email: builder.email,
            phoneNumber: builder.phoneNumber
          });
          cb()
        } else {
          if (user.team._id) {
            invitees.push({
              _id: user.team._id,
              email: builder.email,
              phoneNumber: builder.phoneNumber
            });
            newInvitees.push({
              _id: user.team._id,
              email: builder.email,
              phoneNumber: builder.phoneNumber
            });
            Team.findById(user.team._id, function(err, team){
              if (err) {return cb(err);}
              team.project.push(builderPackage.project);
              team._user = req.user;
              team.save(function(err){
                if (err) {return res.send(500,err);}
              });
            });
            cb();
          } else {
            cb();
          }
        }
      });
    }, function(err){
      if (err) {return res.send(500,err);}
      builderPackage.invitees = invitees;
      builderPackage.newInvitees = newInvitees;
      builderPackage._ownerUser = req.user;
      builderPackage._editUser = req.user;
      builderPackage.markModified('inviteBuilder');
      builderPackage.save(function(err){
        if (err) {return res.send(500,err);}
        builderPackage.populate('invitees.quoteDocument', function(err){
          if (err) {return res.send(500,err);}
          return res.json(200,builderPackage);
        });
      });
    });
  });
};

exports.declineQuote = function(req, res) {
  BuilderPackage.findById(req.body.id, function(err, builderPackage) {
    if (err) {return res.send(500,err);}
    var ownerUser = {};
    _.each(builderPackage.invitees, function(invitee){
      if (invitee._id == req.body.belongTo) {
        invitee.isDecline = true;
        ownerUser = req.body.belongTo;
        Team.findById(invitee._id, function(err,team){
          if (err || !team) {return res.send(500,err);}
          var index = team.project.indexOf(builderPackage.project);
          team.project.splice(index,1);
          team.markModified('project');
          team._user = req.user;
          team.save(function(err){
            if (err) {return res.send(500,err);}
          });
        });
        invitee._id = null;
        invitee.quoteDocument = [];
      }
    });
    builderPackage.markModified('decline-quote');
    builderPackage._ownerUser = ownerUser;
    builderPackage._editUser = req.user;
    builderPackage.save(function(err, saved) {
      if (err) {return res.send(500,err);}
      else {
        return res.json(200, saved);
      }
    });
  });
};

exports.selectWinner = function(req, res) {
  BuilderPackage.findById(req.body.id, function(err, builderPackage){
    if (err) {return res.send(500,err);}
    if (!builderPackage) {return res.send(404);}
    builderPackage.winner = req.body.selector;
    builderPackage.hasWinner = true;
    builderPackage.hasTempWinner = false;
    _.remove(builderPackage.invitees,{_id: builderPackage.winner});
    _.each(builderPackage.invitees, function(invitee){
      if (invitee._id) {
        Team.findById(invitee._id, function(err,team){
          if (err || !team) {return res.send(500,err);}
          var index = team.project.indexOf(builderPackage.project);
          team.project.splice(index,1);
          team.markModified('project');
          team._user = req.user;
          team.save(function(err){
            if (err) {return res.send(500,err);}
          });
        });
      }
    });
    builderPackage.markModified('selectQuote');
    builderPackage._ownerUser = req.body.selector;
    builderPackage._editUser = req.user;
    builderPackage.save(function(err, saved) {
      if (err) {return res.send(500,err);}
      else {
        BuilderPackage.findById(saved._id).populate('winner').exec(function(err,builderPackage) {
          if (err) {return res.send(500,err);}
          else {
            return res.json(200,builderPackage);
          }
        }); 
      }
    });
  });
};

exports.sendMessage = function(req, res) {
  BuilderPackage.findById(req.params.id, function(err, builderPackage) {
    if (err) {return res.send(500,err)}
    if (!builderPackage) {return res.send(404)}
    else {
      builderPackage.messages.push({
        owner: req.body.owner,
        to: req.body.to,
        sendBy: req.user.team._id,
        message: req.body.message,
        sendAt: new Date()
      });
      builderPackage.markModified('sendMessage');
      builderPackage._editUser = req.body.to;
      builderPackage._ownerUser = req.user;
      builderPackage.save(function(err, saved) {
        if (err) {return res.send(500, err)}
        else {
          BuilderPackage.populate(saved,[{path:'messages.sendBy'},{path: 'invitees.quoteDocument'}] , function(err,builderPackage){
            if (err) {return res.send(500,err);}
            EventBus.emit('socket:emit', {
              event: 'messageInBuilderPackageTender:new',
              room: builderPackage._id.toString(),
              data: builderPackage
            });
            return res.json(200,builderPackage);
          });
        }
      });
    }
  });
};

exports.sendMessageToArchitect = function(req, res) {
  var user = req.user;
  BuilderPackage.findById(req.params.id, function(err, builderPackage) {
    if (err) {return res.send(500,err)}
    if (!builderPackage) {return res.send(404,err)}
    else {
      builderPackage.messages.push({
        owner: builderPackage.architect.team,
        to: req.body.to,
        sendBy: req.user.team._id,
        message: req.body.message,
        sendAt: new Date()
      });
      builderPackage.markModified('sendMessageToArchitect');
      builderPackage._editUser = req.user;
      builderPackage.save(function(err, saved) {
        if (err) {return res.send(500, err)}
        else {
          BuilderPackage.populate(saved,[{path:'messages.sendBy'},{path: 'invitees.quoteDocument'}] , function(err,builderPackage){
            if (err) {return res.send(500,err);}
            EventBus.emit('socket:emit', {
              event: 'messageInBuilderPackageTender:new',
              room: builderPackage._id.toString(),
              data: builderPackage
            });
            var messagesFiltered = [];
            _.each(builderPackage.messages, function(message){
              if (message.to.toString() == user.team._id.toString()) {
                messagesFiltered.push(message);
              }
            });
            builderPackage.messages = [];
            builderPackage.messages = messagesFiltered;
            return res.json(200,builderPackage);
          });
        }
      });
    }
  });
};