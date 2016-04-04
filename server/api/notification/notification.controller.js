'use strict';

var mongoose = require('mongoose');
var objectID = require('mongoose').Types.ObjectId;
var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var Notification = require('./../../models/notification.model');
var Validator = require('./../../validators/staffPackage');
var errorsHelper = require('./../../components/helpers/errors');
var _ = require('lodash');
var async = require('async');
var EventBus = require('../../components/EventBus');

// mark all notifications which related to the current opening element as read
exports.markItemsAsRead = function(req, res) {
    var id= new require('mongoose').Types.ObjectId(req.params.id);
    Notification.update({'element._id': id, owner: req.user._id},{unread : false},{multi : true},function(err) {
        if (err) {return res.send(500);}
        return res.send(200);
    });
};

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
    var limit = (req.query.limit) ? req.query.limit : 10;
    Notification.find({owner : user._id,unread : true, $or:[{type: "invite-to-project"}, {referenceTo: "team"}]})
    .sort('-createdAt')
    .limit(limit)
    .populate('owner', '-hashedPassword -salt')
    .populate('fromUser', '-hashedPassword -salt')
    .populate('toUser', '-hashedPassword -salt')
    .exec(function(err, notifications) {
        if (err || !notifications) {
            return res.send(500,err);
        }
        return res.json(notifications);
    })
};

// count total notifications for web app
exports.countTotal = function(req,res) {
    var user = req.user;
    Notification.find({owner : user._id, unread : true, $or:[{type: "invite-to-project"}, {referenceTo: "team"}]})
    .exec(function(err,notifications) {
        if (err) {
          return res.send(500,err);
        }
        var count = notifications.length;
        return res.json({count : count});
    });
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

// mark all notification as read
exports.allRead = function(req,res) {
  var user = req.user;
  Notification.update({owner: user._id},{unread : false},{multi : true},function(err,e) {
    if (err) {
      return res.send(500,err)
    }
    Notification.find({owner : user._id})
      .sort('-createdDate')
      .populate('owner', '-hashedPassword -salt')
      .populate('fromUser', '-hashedPassword -salt')
      .populate('toUser', '-hashedPassword -salt')
      .populate('toUser', '-hashedPassword -salt')
      .exec(function(err, notifications) {
        if (err || !notifications) {
          return res.send(500,err);
        }
        return res.json(notifications);
      })
  })
};

// count total notifications for ionic app
// but this no need longer because current ionic app haven't got count notification
exports.countTotalForIOS = function(req, res) {
  var user = req.user;
  Notification.find({owner : user._id, unread : true, $or:[{type: "invite-to-project"}, {referenceTo: "team"}]})
  .populate('fromUser','-hashedPassword -salt')
  .exec(function(err, notifications){
    if (err) {return res.send(500,err);}
    if (!notifications) {return res.send(404);}
    async.each(notifications, function(notification, cb) {
      Project.findById(notification.element.project, function(err,project) {
        if (err) {console.log(err);cb();}
        if (!project) {console.log("no project"); cb();}
        else {
          notification.element.project = project;
          cb();
        }
      });
    }, function() {
      return res.send(200, notifications);
    });
  })
};