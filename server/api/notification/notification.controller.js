'use strict';

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
    Notification.find({$or:[{owner: user._id},{toUser: user._id}], unread: true, referenceTo: 'DocumentPackage'})
    .populate('element.uploadIn.project').exec(function(err, notification){
      if (err) {console.log(err);return res.send(500,err);}
      if (!notification) {return res.send(404,err);}
      else {
        return res.send(200,notification);
      }
  });
}