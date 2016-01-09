var _ = require('lodash');
var async = require('async');
var User = require('./../../models/user.model');
    Thread = require('./../../models/thread.model');
    Task = require('./../../models/task.model');
    File = require('./../../models/file.model');


exports.responseWithRelated = function(type, data, user, res){
    var relatedItem = [];
    async.parallel([
        function(cb) {
            if (data.belongTo.type) {
                switch (data.belongTo.type) {
                    case "thread":
                        Thread.findById(data.belongTo.item._id, '_id name', function(err, thread) {
                            if (err || !thread) {cb();}
                            else {
                                data.belongTo.item = thread;
                                cb();
                            }
                        });
                    break;

                    case "task":
                        Task.findById(data.belongTo.item._id, '_id name', function(err, task) {
                            if (err || !task) {cb();}
                            else {
                                data.belongTo.item = task;
                                cb();
                            }
                        });
                    break;

                    default:
                        cb();
                    break;
                }
            } else {
                cb();
            }
        },
        function(cb) {
            async.each(data.relatedItem, function(item, callback) {
                if (_.findIndex(item.members, function(member){return member.toString() === user._id.toString();}) !== -1) {
                    if (item.type === "thread") {
                        Thread.findById(item.item._id, '_id name messages')
                        .populate("messages.user", '_id name email')
                        .populate("messages.mentions", '_id name email')
                        .exec(function(err, _thread) {
                            if (err || !_thread) {callback();}
                            else {
                                item.item = _thread;
                                relatedItem.push(item);
                                callback();
                            }
                        });
                    } else if (item.type === "task") {
                        Task.findById(item.item._id, '_id name description activities')
                        .populate("activities.user")
                        .exec(function(err, _task) {
                            if (err || !_task) {callback();}
                            else {
                                item.item = _task;
                                relatedItem.push(item);
                                callback();
                            }
                        });
                    } else {
                        callback();
                    }
                } else {
                    callback();
                }
            }, function() {
                data.relatedItem = relatedItem;
                cb();
            });
        }
    ], function(err, result) {
        if (err) {console.log("err");console.log(err);}
        return res.send(200,data);
    });
};