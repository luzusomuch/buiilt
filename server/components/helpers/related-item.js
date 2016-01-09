var _ = require('lodash');
var async = require('async');
var User = require('./../../models/user.model');
    Thread = require('./../../models/thread.model');
    Task = require('./../../models/task.model');


exports.responseWithRelated = function(thread, user, res){
    var relatedItem = [];
    async.each(thread.relatedItem, function(item, cb) {
        if (_.findIndex(item.members, function(member){return member.toString() === user._id.toString();}) !== -1) {
            if (item.type === "thread") {
                Thread.findById(item.item._id, '_id name messages')
                .populate("messages.user", '_id name email')
                .populate("messages.mentions", '_id name email')
                .exec(function(err, _thread) {
                    if (err || !_thread) {cb();}
                    else {
                        item.item = _thread;
                        relatedItem.push(item);
                        cb();
                    }
                });
            } else if (item.type === "task") {
                Task.findById(item.item._id, '_id name description activities')
                .populate("activities.user")
                .exec(function(err, _task) {
                    if (err || !_task) {cb();}
                    else {
                        item.item = _task;
                        relatedItem.push(item);
                        cb();
                    }
                });
            } else {
                cb();
            }
        } else {
            cb();
        }
    }, function() {
        thread.relatedItem = relatedItem;
        return res.send(200, thread);
    });
};