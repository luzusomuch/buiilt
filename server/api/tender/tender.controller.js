'use strict';
var _ = require('lodash');
var async = require('async');
var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var People = require('./../../models/people.model');
var Tender = require('./../../models/tender.model');
var InviteToken = require('./../../models/inviteToken.model');
var EventBus = require('../../components/EventBus');

exports.create = function(req, res) {
    var data = req.body;
    var tender = new Tender({
        owner: req.user._id,
        ownerType: (data.project.projectManager.type === "architect") ? "architects" : "builders",
        project: data.project._id,
        name: data.name,
        description: data.description,
        dateEnd: data.dateEnd,
        type: data.type
    });
    tender.save(function(err) {
        if (err) {return res.send(500,err);}
        else {
            return res.send(200, tender);
        }
    });  
};

exports.update = function(req, res) {
    var data = req.body;
    Tender.findById(req.params.id, function(err, tender) {
        if (err) {return res.send(500,err);}
        else if (!tender) {return res.send(404);}
        var activity = {
            user: req.user._id,
            type: data.editType,
            acknowledgeUsers: [],
            createdAt: new Date(),
            element: {
                members: [],
                element: {}
            }
        };
        if (data.file) {
            activity.element.link = addendum.element.link = data.file.url;
        }
        async.parallel([
            function(cb) {
                if (data.editType === "attach-addendum") {
                    activity.element.name = data.name;
                    activity.element.description = data.description;
                    activity.acknowledgeUsers = [];
                    _.each(tender.members, function(member) {
                        activity.acknowledgeUsers.push({_id:member, isAcknow: false});
                    });
                    _.each(tender.notMembers, function(member) {
                        activity.acknowledgeUsers.push({email: member, isAcknow: false});
                    });
                    cb();
                } else if (data.editType === "distribute-status") {
                    tender.isDistribute = true;
                    cb();
                } else if (data.editType === "attach-scope") {
                    activity.element.description = data.description;
                    cb();
                } else if (data.editType === "invite-tender") {
                    var members = [];
                    var tenderMembers = tender.members;
                    var notMembers = tender.notMembers;
                    async.each(data.newMembers, function(member, cb) {
                        User.findOne({email: member.email}, function(err, user) {
                            if (err) {cb(err);}
                            else if (!user) {
                                members.push({name:member.name, email: member.email});
                                notMembers.push(member.email);
                                var inviteToken = new InviteToken({
                                    type: 'tender-invite',
                                    email: member.email,
                                    element: {
                                        project: tender.project,
                                        type: tender.type
                                    }
                                });
                                inviteToken._editUser = req.user;
                                inviteToken.save(cb());
                            } else {
                                members.push({name:user.name, email: user.email});
                                tenderMembers.push(user._id);
                                var inviteToken = new InviteToken({
                                    type: 'project-invite',
                                    user: user._id,
                                    element: {
                                        project: tender.project,
                                        type: tender.type
                                    }
                                });
                                inviteToken._editUser = req.user;
                                inviteToken.save(cb());
                            }
                        });
                    }, function() {
                        activity.element.members = members;
                        tender.members = tenderMembers;
                        tender.notMembers = notMembers;
                        cb();
                    });
                } else {
                    cb();
                }
            }
        ], function(err) {
            if (err) {return res,send(500,err);}
            tender.activities.push(activity);
            tender._editUser = req.user;
            tender.markModified(data.editType);
            tender.save(function(err) {
                if (err) {return res.send(500,err);}
                Tender.populate(tender, [
                    {path: "owner", select: "_id name email"},
                    {path: "members", select: "_id name email"},
                    {path: "activities.user", select: "_id name email"},
                    {path: "activities.acknowledgeUsers._id", select: "_id name email"}
                ], function(err, tender) {
                    EventBus.emit("socket:emit", {
                        event: "tender:update",
                        room: tender._id.toString(),
                        data: tender
                    });
                    return res.send(200, tender);
                });
            });
        });
    });
};

exports.getAll = function(req, res) {
    Tender.find({$or:[{owner: req.user._id}, {members: req.user._id}]}, function(err, tenders) {
        if (err) {return res.send(500,err);}
        else {
            return res.send(200, tenders);
        }
    });
};

exports.get = function(req, res) {
    Tender.findById(req.params.id)
    .populate("owner", "_id name email")
    .populate("members", "_id name email")
    .populate("activities.user", "_id name email")
    .populate("activities.acknowledgeUsers._id", "_id name email")
    .exec(function(err, tender) {
        if (err) {return res.send(500,err);}
        else if (!tender) {return res.send(404);}
        return res.send(200,tender);
    });
};