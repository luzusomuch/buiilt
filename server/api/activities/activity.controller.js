'use strict';

var Activity = require('./../../models/activity.model');
var ActivityValidator = require('./../../validators/activity');
var User = require('./../../models/user.model');
var Thread = require('./../../models/thread.model');
var Task = require('./../../models/task.model');
var File = require('./../../models/file.model');
var CheckMembers = require("./../../components/helpers/checkMembers");
var _ = require('lodash');
var async = require('async');
var moment = require("moment");
var mongoose = require("mongoose");

/*Create new activity or milestone*/
exports.create = function(req, res) {
    ActivityValidator.validateCreate(req, function(err, data) {
        if (err) {return res.send(422, err);}
        var activity = new Activity(data);
        activity.project = req.params.id;
        activity.owner = req.user._id;
        if (!activity.isMilestone) {
            if (moment(moment(data.date.start).format("YYYY-MM-DD")).isAfter(moment(data.date.end).format("YYYY-MM-DD"))) {
                return res.send(422, {msg: "End Date Must Greator Than Start Date"});
            }
            if (data.date.duration && data.date.duration <= 0) {
                return res.send(422, {msg: "Duration Must Greator Than 0"});
            }
            activity.date.start = data.date.start;
            activity.date.end = data.date.end;

            activity.time.start = data.time.start;
            activity.time.end = data.time.end;
        }
        if (req.body.newMembers.length === 0) {
            return res.send(422, {msg: "Please check your new members list"});
        }
        CheckMembers.check(req.body.newMembers, null, function(result) {
            activity.members = result.members;
            activity.notMembers = result.notMembers;
            activity.save(function(err) {
                if (err) {return res.send(500,err);}
                return res.send(200, activity);
            });
        });
    });
};

exports.update = function(req, res) {
    var data = req.body;
    Activity.findById(req.params.id, function(err, activity) {
        if (err) {return res.send(500,err);}
        if (!activity) {return res.send(404);}

        async.parallel([
            function(cb) {
                if (data.editType === "assign-people"){
                    if (data.newMembers && data.newMembers.length === 0) {
                        return res.send(406, {msg: "Please select at least 1 member"});
                    } else {
                        CheckMembers.check(data.newMembers, activity, function(result) {
                            activity.members = result.members;
                            activity.notMembers = result.notMembers;
                            cb();
                        });
                    }
                } else if (data.editType==="insert-activities") {
                    if (data.newActivities && data.newActivities.length===0) {
                        return res.send(406, {msg: "Please select at least 1 activity"});
                    } else {
                        _.each(data.newActivities, function(act) {
                            activity.subActivities.push(act._id);
                        });
                        cb();
                    }
                } else if (data.editType==="change-date-time") {
                    activity.date = data.date;
                    cb();
                } else {
                    cb();
                }
            }
        ], function() {
            activity.save(function(err) {
                if (err) {return res.send(500,err);}
                return res.send(200, activity);
            });
        });
    });
};

/*Get all activities and milestone related to current user*/
exports.me = function(req, res) {
    Activity.find({project: req.params.id, $or: [{owner: req.user._id}, {members: req.user._id}]})
    .populate("subActivities")
    .exec(function(err, activities) {
        if (err) {return res.send(500,err);}
        return res.send(200, activities);
    });
};

var getMainItem = function(type) {
    var _item = {};
    switch (type) {
        case 'thread' :
            _item = Thread;
            break;
        case 'task' :
            _item = Task;
            break;
        case "file":
            _item = File
            break;
        default :
            break;
    }
    return _item;
};

/*Get activity detail*/
exports.get = function(req, res) {
    Activity.findById(req.params.id)
    .populate("members", "_id name email phoneNumber")
    .populate("owner", "_id name email phoneNumber")
    .exec(function(err, activity) {
        if (err) {return res.send(500,err);}
        if (!activity) {return res.send(404, {msg: "The selected item not found"});}
        async.each(activity.relatedItem, function(item, cb) {
            getMainItem(item.type).findById(item.item._id, "_id name description", function(err, data) {
                if (err || !data) {cb(err);}
                else {
                    item.item = data;
                    cb();
                }
            });
        }, function() {
            return res.send(200, activity);
        });
    });
};