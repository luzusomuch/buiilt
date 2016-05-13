'use strict';
var _ = require('lodash');
var async = require('async');
var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var People = require('./../../models/people.model');
var Tender = require('./../../models/tender.model');
var InviteToken = require('./../../models/inviteToken.model');
var Notification = require('./../../models/notification.model');
var Thread = require('./../../models/thread.model');
var Document = require('./../../models/document.model');
var Activity = require('./../../models/activity.model');
var PackageInvite = require('./../../models/packageInvite.model');
var NotificationHelper = require('./../../components/helpers/notification');
var EventBus = require('../../components/EventBus');
var moment = require("moment");

/*
    create new tender package
*/
exports.create = function(req, res) {
    var data = req.body;
    var tender = new Tender({
        owner: req.user._id,
        ownerType: (data.project.projectManager.type === "architect") ? "architects" : "builders",
        project: data.project._id,
        name: (data.name) ? data.name : "Untitled Tender",
        description: data.description,
        dateEnd: data.dateEnd,
        type: data.type
    });
    tender.save(function(err) {
        if (err) {return res.send(500,err);}
        else {
            EventBus.emit('socket:emit', {
                event: 'tender:new',
                room: req.user._id.toString(),
                data: tender
            });
            return res.send(200, tender);
        }
    });  
};

/*
    Update tender info
    attach addendum, distribute status, invite tender, attach scope, attach tender file
*/
exports.update = function(req, res) {
    var data = req.body;
    Tender.findById(req.params.id, function(err, tender) {
        if (err) {return res.send(500,err);}
        else if (!tender) {return res.send(404);}
        if (tender.status==="close") {
            return res.send(500, {msg: "This Tender Closed"});
        } else if (!tender.type && !data.selectedTenterType && data.editType==="invite-tenderer") {
            return res.send(422, {msg: "Please select tender type"});
        } else if (tender.documentSet && data.editType==="attach-document-set") {
            return res.send(500, {msg: "This tender is already have document set"});
        }
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
                    var members = [];
                    var notMembers = [];
                    _.each(tender.members, function(member) {
                        if (member.user) {
                            members.push(member.user);
                        } else {
                            notMembers.push(member.email);
                        }
                    });
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
                        members: members,
                        notMembers: notMembers,
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
                    activity.element.addendum = data.addendum;
                    Thread.find({name: new RegExp(tender.name, 'i'), project: tender.project, "element.type": "tender", owner: req.user._id}, function(err, threads) {
                        if (err) {
                            cb(err);
                        } else {
                            async.each(threads, function(thread, callback) {
                                thread.messages.push({
                                    user: req.user._id,
                                    text: "Tender Addendum: "+data.addendum,
                                    sendAt: new Date()
                                });
                                thread._editUser = req.user;
                                thread.save(callback);
                            }, cb);
                        }
                    });
                } else if (data.editType==="change-title") {
                    tender.name = data.name;
                    cb();
                } else if (data.editType === "distribute-status") {
                    tender.isDistribute = true;
                    cb();
                } else if (data.editType === "attach-scope") {
                    activity.element.scope = data.scope;
                    tender.isCreateScope = true;
                    async.each(tender.members, function(member, callback) {
                        var query = {};
                        if (member.user) {
                            query = {_id: member.user};
                        } else {
                            query = {email: member.email}
                        }
                        User.findOne(query, function(err, user) {
                            if (err || !user) 
                                callback();
                            else {
                                var thread = new Thread({
                                    name: tender.name,
                                    project: tender.project,
                                    owner: req.user._id,
                                    element: {type: "tender"},
                                    messages: [{user: req.user._id, text: "Tender Scope: "+data.scope, sendAt: new Date()}]
                                });
                                if (member.user) {
                                    thread.members = [member.user];
                                    thread.name += " " +user.name;
                                } else {
                                    thread.notMembers = [member.email];
                                    thread.name+= " " + member.name;
                                }
                                thread._editUser=req.user;
                                thread.save(callback);
                            }
                        });
                    },cb);
                } else if (data.editType === "invite-tenderer") {
                    var members = [];
                    var tenderMembers = tender.members;
                    if (data.selectedTenterType) 
                        tender.type = data.selectedTenterType;
                    
                    async.each(data.newMembers, function(member, cb) {
                        User.findOne({email: member.email}, function(err, _user) {
                            if (err) {cb(err);}
                            else if (!_user) {
                                newInvitees.push({email: member.email, name: member.name, phoneNumber: member.phoneNumber});
                                members.push({name:member.name, email: member.email, phoneNumber: member.phoneNumber});
                                tenderMembers.push({email: member.email, name: member.name, phoneNumber: member.phoneNumber});
                                cb();
                            } else {
                                newInvitees.push({_id: _user._id, email: _user.email, name: _user.name, phoneNumber: _user.phoneNumber});
                                members.push({name:_user.name, email: _user.email, _id: _user._id});
                                tenderMembers.push({user: _user._id});
                                if (tender.isCreateScope) {
                                    var thread = new Thread({
                                        name: tender.name +" "+ _user.name,
                                        owner: req.user._id,
                                        project: tender.project,
                                        element: {type: "tender"},
                                        messages: []
                                    });
                                    var scopeActivityIndex = _.findIndex(tender.activities, function(activity) {
                                        return activity.type==="attach-scope";
                                    });
                                    if (scopeActivityIndex !== -1) {
                                        thread.messages.push({user: req.user._id, createdAt: new Date(), text: "Tender Scope: "+tender.activities[scopeActivityIndex].element.scope});
                                    }
                                    _.each(tender.activities, function(activity) {
                                        if (activity.type==="attach-addendum") {
                                            thread.messages.push({user: req.user._id, createdAt: new Date(), text: "Tender Addendum: "+activity.element.addendum})
                                        }
                                    });
                                    thread.save(function(err) {
                                        if (err) {cb(err);}
                                        _user.projects.push(tender.project);
                                        _user.save(cb);
                                    });
                                } else {
                                    _user.projects.push(tender.project);
                                    _user.save(cb);
                                }
                            }
                        });
                    }, function() {
                        activity.element.members = members;
                        tender.members = tenderMembers;
                        /*If tender has document set then add new tenderer to that 
                        document set member.*/
                        if (tender.documentSet) {
                            Document.findById(tender.documentSet, function(err, documentSet) {
                                if (err || !documentSet) {cb(err);}
                                else {
                                    _.each(members, function(member) {
                                        if (member._id) {
                                            documentSet.members.push(member._id);
                                        } else {
                                            documentSet.notMembers.push(member.email);
                                        }
                                    });
                                    documentSet.save(cb);
                                }
                            });
                        } else {
                            cb();
                        }
                    });
                } else if (data.editType==="attach-document-set") {
                    tender.documentSet = data.documentSetSelected;
                    Document.findById(data.documentSetSelected, function(err, document) {
                        if (err || !document) {
                            tender.documentSet = null;
                            cb(err);
                        } else {
                            document.tender = tender._id;
                            _.each(tender.members, function(member) {
                                if (member.user) {
                                    document.members.push(member.user);
                                } else {
                                    document.notMembers.push(member.email);
                                }
                            });
                            document.save(cb);
                        }
                    });
                } else if (data.editType==="add-event" || data.editType==="change-event") {
                    tender.event = data.selectedEvent;
                    cb();
                } else if (data.editType==="select-winner") {
                    tender.status = "close";
                    var winnerTenderer = tender.members[data.winnerIndex];
                    var loserTenderer = tender.members.splice(data.winnerTenderer, 1);
                    if (winnerTenderer.user) {
                        tender.winner._id = winnerTenderer.user;
                    } else {
                        tender.winner.email = winnerTenderer.email;
                    }
                    async.each(loserTenderer, function(tenderer, callback) {
                        var query = (tenderer.user) ? {_id: tenderer.user} : {email: tenderer.email};
                        User.findOne(query, function(err, user) {
                            if (err || !user) {callback(err);}
                            else {
                                var projectIndex = user.projects.indexOf(tender.project);
                                user.projects.splice(projectIndex, 1);
                                user.save(callback);
                            }
                        })   
                    }, function() {
                        People.findOne({project: tender.project}, function(err, people) {
                            if (err || !people) {
                                cb(err);
                            } else {
                                var tenderers = [];
                                if (winnerTenderer.user) {
                                    tenderers.push({_id: winnerTenderer.user, teamMember: []});
                                } else {
                                    tenderers.push({name: winnerTenderer.name, email: winnerTenderer.email, phoneNumber: winnerTenderer.phoneNumber, teamMember: []});
                                }
                                people[tender.type].push({tenderName: tender.name, inviter: tender.owner, inviterType: tender.ownerType, hasSelect: true, tenderers: tenderers});
                                people.save(function(err) {
                                    if (err) {cb(err);}
                                    else {
                                        if (winnerTenderer.user) {
                                            cb();
                                        } else {
                                            var packageInvite = new PackageInvite({
                                                owner: req.user._id,
                                                to: winnerTenderer.email,
                                                inviteType: tender.type,
                                                package: tender._id,
                                                project: tender.project
                                            });
                                            packageInvite.save(cb);
                                        }
                                    }
                                });
                            }
                        });
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

/*
    get all tenders package for current user
    if in backend, it'll need query userId
*/
exports.getAllByProject = function(req, res) {
    var userId = (req.query.userId) ? req.query.userId : req.user._id;
    Tender.find({project: req.params.id, $or:[{owner: userId}, {"members.user": userId}, {"members.teamMember": userId}]})
    .populate("members.user", "_id name email phoneNumber")
    .populate("members.teamMember", "_id name email phoneNumber")
    .populate("owner", "_id name email phoneNumber")
    .populate("event", "_id name")
    .exec(function(err, tenders) {
        if (err) {return res.send(500,err);}
        else {
            async.each(tenders, function(tender, cb) {
                if (tender.owner._id.toString()!==req.user._id.toString()) {
                    tender.members = [];
                }
                Notification.find({owner: req.user._id, "element._id": tender._id, unread: true, referenceTo: "tender", $or:[{type: "tender-message"}, {type: "tender-submission"}]}, function(err, notifications) {
                    if (err) {cb(err);}
                    else {
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

/*
    get tender package by id
*/
exports.get = function(req, res) {
    Tender.findById(req.params.id)
    .populate("owner", "_id name email phoneNumber")
    .populate("members.user", "_id name email phoneNumber")
    .populate("members.activities.user", "_id name email")
    .populate("activities.user", "_id name email")
    .populate("activities.acknowledgeUsers._id", "_id name email")
    .populate("winner._id", "_id name email phoneNumber")
    .exec(function(err, tender) {
        if (err) {return res.send(500,err);}
        if (!tender) {return res.send(404);}
        if (req.query.admin && req.user.role==="admin") {
            return res.send(200, tender);
        }
        return res.send(200,responseTender(tender, req.user));
    });
};

/*
    send accknowledgement to tender owner
*/
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

/*
    Tender package owner upload new tender document
*/
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

/*
    Tender package owner select a winner
*/
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
                                people._newInviteeSignUpAlready = [tender.winner._id];
                                people.markModified("invitePeople");
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

/*
    Response correct data for the current tenderer
*/
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

/*
    Tenderer and owner send reply
    Tenderer send a submission to owner
*/
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
                var params = {
                    owners: [(tender.owner.toString()===req.user._id.toString()) ? tender.members[currentTendererIndex].user : tender.owner],
                    fromUser: req.user._id,
                    element: tender,
                    referenceTo: "tender",
                    type: "tender-message"
                };
            } else {
                activity.element.link = data.file.url;
                activity.element.name = data.file.filename;
                activity.element.description = data.description;
                var params = {
                    owners: [tender.owner],
                    fromUser: req.user._id,
                    element: tender,
                    referenceTo: "tender",
                    type: "tender-submission"
                };
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
                    if (data.type === "send-message" && !tender.members[currentTendererIndex].user) {
                        EventBus.emit("socket:emit", {
                            event: "invitee:updated",
                            room: tender.members[currentTendererIndex]._id.toString(),
                            data: tender.members[currentTendererIndex]
                        });
                        return res.send(200);
                    }
                    NotificationHelper.create(params, function(err) {
                        if (err) {return res.send(500,err);}
                        EventBus.emit("socket:emit", {
                            event: "invitee:updated",
                            room: tender.members[currentTendererIndex]._id.toString(),
                            data: tender.members[currentTendererIndex]
                        });
                        return res.send(200);
                    });
                });
            });
        } else {
            return res.send(500, {messsage: "Error"});
        }
    });
};

/*
    Delete selected tender package
    Require admin role
*/
exports.delete = function(req, res) {
    Tender.findByIdAndRemove(req.params.id, function (err, tender) {
        if (err) {
            return res.send(500, err);
        }
        return res.send(200);
    });
};