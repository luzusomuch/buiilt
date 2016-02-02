var _ = require('lodash');
var async = require('async');
var Notification = require('./../../models/notification.model'),
    User = require('./../../models/user.model');
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
                console.log("Error on insert Notification " + err);
                return callback(err);
            }
            if (notification.type === "invite-to-project" || notification.referenceTo === "team") {
                Notification.populate(notification,[
                    {path : 'owner', select: '-hashedPassword -salt'},
                    {path : 'fromUser', select: '-hashedPassword -salt'},
                    {path : 'toUser', select: '-hashedPassword -salt'}
                ],function(err, notification) {
                    EventBus.emit('socket:emit', {
                        event: 'notification:new',
                        room: notification.owner._id.toString(),
                        data: notification
                    });
                    callback(null);
                });
            } else {
                callback(null);
            }
        });
    },function(err) {
        if (err) {
            return cb(err);
        }
        return cb(null);
    })
};