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

exports.markItemsAsRead = function(req, res) {
    var id= new require('mongoose').Types.ObjectId(req.params.id);
    Notification.update({'element._id': id},{unread : false},{multi : true},function(err) {
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

exports.dashboardRead = function(req,res) {
  var id= new require('mongoose').Types.ObjectId(req.params.id);
  Notification.update({'element._id': id},{unread : false},{multi : true},function(err) {
    if (err) {
      return res.send(500)
    }
    return res.json(true);
  });
};

exports.markReadByPackage = function(req,res) {
  var user = req.user;
  var packageId = new objectID(req.params.id);
  Notification.find({owner:user._id,'element.package' : packageId,unread : true},function(err,notifications) {
    async.each(notifications,function(notification,callback) {
      notification.unread = false;
      notification.save(callback)
    },function() {
      EventBus.emit('socket:emit', {
        event: 'notification:read',
        room: user._id.toString(),
        data: notifications
      });
      return res.json(notifications);
    });
  })
}

exports.dashboardReadDocument = function(req,res){
  var id= new objectID(req.params.id);
  Notification.update({'_id': id},{unread : false},{multi : true},function(err) {
    if (err) {
      return res.send(500)
    }
    return res.json(true);
  });
};

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



exports.getMyFile = function(req, res) {
  var user = req.user;
  Notification.find({owner: user._id,unread: true, 'element.projectId': mongoose.Types.ObjectId(req.params.id)}, function(err, notifications){
    if (err) {;return res.send(500,err);}
    if (!notifications) {return res.send(500,err);}
    else {
      return res.send(200,notifications);
    }
  });
};

exports.countTotalForIOS = function(req, res) {
  var user = req.user;
  Notification.find({owner: user._id, unread:true, $or:[{referenceTo: 'task'},{referenceTo: 'thread'}, {referenceTo: 'people-chat'}, {referenceTo: 'board-chat'}, {type: 'invite-people'}, {type: "NewBoard"}]})
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

exports.getOne = function(req, res) {
  Notification.findById(req.params.id, function(err, notification){
    if (err) {return res.send(500,err);}
    if (!notification) {return res.send(404);}
    return res.send(200,notification);
  });
};

exports.getAllChatMessageNotificationByBoard = function(req, res) {
  Notification.find({'element._id': mongoose.Types.ObjectId(req.params.id), type: "chat"})
  .populate('owner', '-hashedPassword -salt')
  .exec(function(err, notifications) {
    if (err) {return res.send(500,err);}
    return res.send(200, notifications);
  });
};

exports.getAllChatMessageNotificationByUserInPeople = function(req, res) {
  Notification.find({'element._id': mongoose.Types.ObjectId(req.params.id), referenceTo: "people-chat"})
  .populate('owner', '-hashedPassword -salt')
  .exec(function(err, notifications) {
    if (err) {return res.send(500,err);}
    return res.send(200, notifications);
  });
};