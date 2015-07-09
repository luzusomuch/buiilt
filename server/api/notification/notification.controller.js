'use strict';

var mongoose = require('mongoose');
var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var Notification = require('./../../models/notification.model');
var Validator = require('./../../validators/staffPackage');
var errorsHelper = require('./../../components/helpers/errors');
var _ = require('lodash');
var async = require('async');

/**
 * Get single notification
 * @param req
 * @param res
 * @param next
 */
exports.notification = function(req,res,next) {
  Notification.findById(req.params.id,function(err,notification) {
    if (err || !notification) {
      return res.send(500,err)
    }
    req.notification = notification;
    next();
  })
};

/**
 * Get list of notifications
 * @param req
 * @param res
 */
exports.get = function(req,res) {
  var user = req.user;
  Notification.find({owner : user._id})
    .sort('-createdDate')
    .populate('owner')
    .populate('fromUser')
    .populate('toUser')
    .exec(function(err, notifications) {
      if (err || !notifications) {
        return res.send(500,err);
      }
      return res.json(notifications);
  })
};

/**
 * Update notification unread field
 * @param res
 * @param req
 */
exports.update = function(req,res) {
  var notification = req.notification;
  notification.unread = false;
  notification.save(function(err) {
    if (err) {
      return res.send(500,err)
    }
    return res.json(true);
  })
};

exports.dashboardRead = function(req,res) {
  var id= new require('mongoose').Types.ObjectId(req.params.id);
  Notification.update({'element._id': id},{unread : false},{multi : true},function(err) {
    if (err) {
      return res.send(500)
    }
    return res.json(true);
  });
};

exports.allRead = function(req,res) {
  var user = req.user;
  Notification.update({toUser: user._id},{unread : false},{multi : true},function(err) {
    if (err) {
      return res.send(500,err)
    }
    Notification.find({toUser : user._id})
      .sort('-createdDate')
      .populate('owner')
      .populate('fromUser')
      .populate('toUser')
      .populate('toUser')
      .exec(function(err, notifications) {
        if (err || !notifications) {
          return res.send(500,err);
        }
        return res.json(notifications);
      })
  })
};

exports.getMyFile = function(req, res) {
  var user = req.user;

  Notification.find({$or:[{owner: user._id},{toUser: user._id},
    {referenceTo: 'DocumentPackage'},{referenceTo: 'DocumentInProject'}],
    unread: true, 'element.projectId': mongoose.Types.ObjectId(req.params.id)}, function(err, notifications){
    if (err) {;return res.send(500,err);}
    if (!notifications) {return res.send(500,err);}
    else {
      return res.send(200,notifications);
    }
  });
}