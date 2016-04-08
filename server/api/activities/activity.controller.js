'use strict';

var Activity = require('./../../models/activity.model');
var ActivityValidator = require('./../../validators/activity');
var User = require('./../../models/user.model');
var CheckMembers = require("./../../components/helpers/checkMembers");
var _ = require('lodash');
var async = require('async');
var moment = require("moment");

exports.create = function(req, res) {
    ActivityValidator.validateCreate(req, function(err, data) {
        if (err) {return res.send(422, err);}
        var activity = new Activity(data);
        activity.project = req.params.id;
        activity.owner = req.user._id;
        if (!activity.isMilestone) {
            activity.date.start = data.date.start;
            activity.date.end = data.date.end;
            activity.time.start = data.time.start;
            activity.time.start = data.time.start;
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

exports.me = function(req, res) {
    Activity.find({project: req.params.id, $or: [{owner: req.user._id}, {members: req.user._id}]}, function(err, activities) {
        if (err) {return res.send(500,err);}
        return res.send(200, activities);
    });
};