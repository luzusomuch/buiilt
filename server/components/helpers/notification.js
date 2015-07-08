var _ = require('lodash');
var async = require('async');
var Notification = require('./../../models/notification.model');
var EventBus = require('./../EventBus');
exports.create = function(params,cb){
  async.each(params.owners,function(owner,callback) {
    var notification = new Notification({
      owner : owner,
      fromUser : params.fromUser,
      toUser : (params.toUser) ? params.toUser : owner,
      element : params.element,
      referenceTo : params.referenceTo,
      type : params.type
    });
    notification.save(function(err) {
      if (err) {
        return callback(err);
      }
      EventBus.emit('socket:emit', {
        event: 'notification:new',
        room: notification.owner.toString(),
        data: notification
      });
      callback(null);
    })
  },function(err) {
    if (err) {
      return cb(err);
    }
    return cb(null);
  })
};