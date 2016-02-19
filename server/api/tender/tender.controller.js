'use strict';
var _ = require('lodash');
var async = require('async');
var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var People = require('./../../models/people.model');
var Tender = require('./../../models/tender.model');
var InviteToken = require('./../../models/inviteToken.model');
var Notification = require('./../../models/notification.model');
var EventBus = require('../../components/EventBus');
var moment = require("moment");

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
        var newFile = {};
        var newInvitees = [];
        async.parallel([
            function(cb) {
                if (data.file) {
                    var file = new File({
                        name : data.file.filename,
                        path : data.file.url,
                        key : data.file.key,
                        server : 's3',
                        mimeType : data.file.mimeType,
                        description : req.body.description,
                        size : data.file.size,
                        project: tender.project,
                        owner: req.user._id,
                        belongTo: {
                            type: "tender",
                            item: {
                                _id: tender._id
                            }
                        },
                        element: {type: "tender"}
                    });
                    file.save(function(err) {
                        if (err) {cb(err);}
                        else {
                            newFile = file;
                            cb();
                        }
                    });
                } else 
                    cb();
            },
            function(cb) {
                if (data.editType === "attach-addendum") {
                    activity.element.name = data.name;
                    activity.element.description = data.description;
                    activity.acknowledgeUsers = [];
                    _.each(tender.members, function(member) {
                        if (member._id) {
                            activity.acknowledgeUsers.push({_id:member.user, isAcknow: false});
                        } else {
                            activity.acknowledgeUsers.push({_id:member.email, isAcknow: false});
                        }
                    });
                    cb();
                } else if (data.editType === "distribute-status") {
                    tender.isDistribute = true;
                    cb();
                } else if (data.editType === "attach-scope") {
                    activity.element.description = data.description;
                    activity.element.dateEnd = (moment(moment(tender.dateEnd).format("YYYY-MM-DD")).isSame(moment(data.dateEnd).format("YYYY-MM-DD"))) ? null : data.dateEnd;
                    tender.description = data.description;
                    tender.dateEnd = data.dateEnd;
                    cb();
                } else if (data.editType === "invite-tender") {
                    var members = [];
                    var tenderMembers = tender.members;
                    async.each(data.newMembers, function(member, cb) {
                        User.findOne({email: member.email}, function(err, _user) {
                            if (err) {cb(err);}
                            else if (!_user) {
                                members.push({name:member.name, email: member.email});
                                tenderMembers.push({email: member.email, name: member.name});
                                newInvitees.push({email: member.email, name: member.name});
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
                                members.push({name:_user.name, email: _user.email});
                                tenderMembers.push({user: _user._id});
                                var inviteToken = new InviteToken({
                                    type: 'project-invite',
                                    user: _user._id,
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
                        cb();
                    });
                } else {
                    cb();
                }
            }
        ], function(err) {
            if (err) {return res,send(500,err);}
            if (data.file) {
                activity.element.link = data.file.url;
                activity.element.fileId = newFile._id;
            }
            tender.activities.push(activity);
            tender._editUser = req.user;
            tender._newInvitees = newInvitees;
            tender.markModified(data.editType);
            tender.save(function(err) {
                if (err) {return res.send(500,err);}
                Tender.populate(tender, [
                    {path: "owner", select: "_id name email"},
                    {path: "members.user", select: "_id name email"},
                    {path: "members.activities.user", select: "_id name email"},
                    {path: "activities.user", select: "_id name email"},
                    {path: "activities.acknowledgeUsers._id", select: "_id name email"}
                ], function(err, tender) {
                    EventBus.emit("socket:emit", {
                        event: "tender:update",
                        room: tender._id.toString(),
                        data: responseTender(tender, req.user)
                    });
                    return res.send(200, responseTender(tender, req.user));
                });
            });
        });
    });
};

exports.getAll = function(req, res) {
    var userId = (req.query.userId) ? req.query.userId : req.user._id;
    Tender.find({$or:[{owner: userId}, {"members.user": userId}]})
    .populate("project").exec(function(err, tenders) {
        if (err) {return res.send(500,err);}
        else {
            async.each(tenders, function(tender, cb) {
                Notification.find({owner: req.user._id, unread: true, referenceTo: "tender", $or:[{type: "tender-message"}, {type: "tender-submission"}]}, function(err, notifications) {
                    if (err) {cb(err);}
                    else {
                        tender.members = [];
                        tender.__v = notifications.length;
                        cb();
                    }
                });
            }, function(err) {
                if (err) {return res.send(500,err);}
                return res.send(200, tenders);
            });
        }
    });
};

exports.get = function(req, res) {
    Tender.findById(req.params.id)
    .populate("owner", "_id name email")
    .populate("members.user", "_id name email")
    .populate("members.activities.user", "_id name email")
    .populate("activities.user", "_id name email")
    .populate("activities.acknowledgeUsers._id", "_id name email")
    .exec(function(err, tender) {
        if (err) {return res.send(500,err);}
        else if (!tender) {return res.send(404);}
        return res.send(200,responseTender(tender, req.user));
    });
};

exports.acknowledgement = function(req, res) {
    Tender.findById(req.params.id, function(err, tender) {
        if (err) {return res.send(500,err);}
        else if (!tender) {return res.send(404);}
        var activityIndex = _.findIndex(tender.activities, function(activity) {
            return activity._id.toString()===req.params.activityId;
        });
        if (activityIndex !== -1) {
            var acknowledgeUserIndex = _.findIndex(tender.activities[activityIndex].acknowledgeUsers, function(user) {
                if (user._id) {
                    return user._id.toString()===req.user._id.toString();
                }
            }); 
            if (acknowledgeUserIndex !== -1) {
                tender.activities[activityIndex].acknowledgeUsers[acknowledgeUserIndex].isAcknow = true;
            } else {
                tender.activities[activityIndex].acknowledgeUsers.push({_id: req.user._id, isAcknow: true});
            }
        }
        tender._editUser = req.user;
        tender.save(function(err) {
            if (err) {return res.send(500,err);}
            Tender.populate(tender, [
                {path: "owner", select: "_id name email"},
                {path: "members.user", select: "_id name email"},
                {path: "members.activities.user", select: "_id name email"},
                {path: "activities.user", select: "_id name email"},
                {path: "activities.acknowledgeUsers._id", select: "_id name email"}
            ], function(err, tender) {
                EventBus.emit("socket:emit", {
                    event: "tender:update",
                    room: tender._id.toString(),
                    data: responseTender(tender, req.user)
                });
                return res.send(200, responseTender(tender, req.user));
            });
        });
    });
};


exports.uploadTenderDocument = function(req, res) {
    var data = req.body;
    Tender.findById(req.params.id, function(err, tender) {
        if (err) {return res.send(500,err);}
        if (!tender) {
            return res.send(404, {message: "This tender is not existed"});
        }
        var file = new File({
            name : data.file.filename,
            path : data.file.url,
            key : data.file.key,
            server : 's3',
            mimeType : data.file.mimeType,
            description : data.description,
            size : data.file.size,
            project: tender.project,
            owner: req.user._id,
            belongTo: {
                type: "tender",
                    item: {
                    _id: tender._id
                }
            },
            element: {type: "tender"}
        });
        file.save(function(err) {
            if (err) {return res.send(500,err);}
            EventBus.emit("socket:emit", {
                event: "tender-document:inserted",
                room: tender._id.toString(),
                data: JSON.parse(JSON.stringify(file))
            });
            return res.send(200);
        });
    });
};

exports.selectWinner = function(req, res) {
    Tender.findById(req.params.id).populate("members.user").exec(function(err, tender){
        if (err) {return res.send(500,err);}
        if (!tender) {return res.send(404, {message: "This tender is not existed"});}
        var currentTendererIndex = _.findIndex(tender.members, function(member) {
            return member._id.toString()===req.query.tendererId.toString();
        });
        if (currentTendererIndex!==-1) {
            if (tender.members[currentTendererIndex].user) {
                tender.winner._id = tender.members[currentTendererIndex].user._id;
            } else {
                tender.winner.email = tender.members[currentTendererIndex].email;
            }
            tender.status = "close";
            var activity = {
                user: req.user._id,
                type: "select-winner",
                createdAt: new Date(),
                element: {name: (tender.members[currentTendererIndex].user) ? tender.members[currentTendererIndex].user.name : tender.members[currentTendererIndex].email}
            }
            tender.activities.push(activity);
            tender._editUser = req.user;
            tender.save(function(err){
                if (err) {return res.send(500,err);}
                Tender.populate(tender, [
                    {path: "owner", select: "_id name email"},
                    {path: "members.user", select: "_id name email"},
                    {path: "members.activities.user", select: "_id name email"},
                    {path: "activities.user", select: "_id name email"},
                    {path: "activities.acknowledgeUsers._id", select: "_id name email"}
                ], function(err, tender) {
                    if (err) {return res.send(500,err);}
                    async.parallel([
                        function(cb) {
                            People.findOne({project: tender.project}, function(err, people) {
                                if (err || !people) {cb(err);}
                                var newTender = {};
                                newTender.isDistribute = true;
                                newTender.hasSelect = true;
                                newTender.inviterType = tender.ownerType;
                                newTender.inviter = tender.owner._id;
                                if (tender.winner._id) {
                                    newTender.tenderers = [{_id: tender.winner._id}];
                                } else {
                                    newTender.tenderers = [{email: tender.winner.email}];
                                }
                                people[tender.type].push(newTender);
                                people.save(cb());
                            });
                        },
                        function(cb) {
                            if (tender.winner._id) {
                                User.findById(tender.winner._id, function(err, user) {
                                    if (err || !user) {cb(err);}
                                    user.projects.push(tender.project);
                                    user.markModified("projects");
                                    user.save(cb());
                                });
                            } else 
                                cb();
                        }
                    ], function(err) {
                        if (err) {return res.send(500,err);}
                        EventBus.emit("socket:emit", {
                            event: "tender:update",
                            room: tender._id.toString(),
                            data: responseTender(tender, req.user)
                        });
                        return res.send(200);
                    });
                });
            });
        } else
            return res.send(500,{message: "Error"});
    });
};

function responseTender(tender, user) {
    if (tender.owner._id.toString()===user._id.toString()) {
        return tender;
    } else {
        var activities = [];
        _.each(tender.activities, function(activity) {
            if (activity.type === "attach-scope") {
                activities.push(activity);
            } else if (activity.type === "attach-addendum") {
                var acknowledgeUsers = [];
                _.each(activity.acknowledgeUsers, function(acknowledgeUser) {
                    if (acknowledgeUser._id) {
                        if (acknowledgeUser._id._id.toString()===user._id.toString()) {
                            acknowledgeUsers.push(acknowledgeUser);
                        }
                    }
                });
                activity.acknowledgeUsers = acknowledgeUsers;
                activities.push(activity);
            }
        });
        tender.activities = activities;
        var currentTendererIndex = _.findIndex(tender.members, function(member) {
            if (member.user) {
                return member.user._id.toString()===user._id.toString();
            }
        })
        tender.members = [tender.members[currentTendererIndex]];
        return tender;
    }
};

exports.updateTenderInvitee = function(req, res) {
    var data = req.body;
    Tender.findById(req.params.id, function(err, tender) {
        if (err) {return res.send(500,err);}
        if (!tender) {return res.send(404, {message: "This tender is not existed"});}
        var currentTendererIndex = _.findIndex(tender.members, function(member){
            return member._id.toString()===req.params.activityId.toString();
        });
        if (currentTendererIndex !== -1) {
            var activity = {
                user: req.user._id,
                type: data.type,
                createdAt: new Date(),
                element: {}
            }
            if (data.type === "send-message") {
                activity.element.text = data.text;
            } else {
                activity.element.link = data.file.url,
                activity.element.name = data.file.filename,
                activity.element.description = data.description
            }
            tender.members[currentTendererIndex].activities.push(activity);
            tender._editUser = req.user;
            tender.save(function(err) {
                if (err) {return res.send(500,err);}
                Tender.populate(tender, [
                    {path: "owner", select: "_id name email"},
                    {path: "members.user", select: "_id name email"},
                    {path: "members.activities.user", select: "_id name email"},
                    {path: "activities.user", select: "_id name email"},
                    {path: "activities.acknowledgeUsers._id", select: "_id name email"}
                ], function(err, tender) {
                    EventBus.emit("socket:emit", {
                        event: "invitee:updated",
                        room: tender.members[currentTendererIndex]._id.toString(),
                        data: tender.members[currentTendererIndex]
                    });
                    return res.send(200);
                });
            });
        } else {
            return res.send(500, {messsage: "Error"});
        }
    });
};

exports.delete = function(req, res) {
    Tender.findByIdAndRemove(req.params.id, function (err, tender) {
        if (err) {
            return res.send(500, err);
        }
        return res.send(200);
    });
};