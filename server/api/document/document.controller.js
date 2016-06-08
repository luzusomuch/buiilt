'use strict';

var Document = require('./../../models/document.model');
var User = require('./../../models/user.model');
var People = require('./../../models/people.model');
var Notification = require('./../../models/notification.model');
var _ = require('lodash');
var async = require('async');
var moment = require("moment");
var CheckMembers = require("./../../components/helpers/checkMembers");
var EventBus = require('../../components/EventBus');
var config = require('../../config/environment');

exports.get = function(req, res) {
    Document.findById(req.params.id)
    .populate("documents").exec(function(err, document) {
        if (err) {return res.send(500,err);}
        else if (!document) {return res.send(404, {msg: "This Document Set Not Exist"});}
        else {
            async.each(document.documents, function(doc, cb) {
                Notification.find({unread: true, owner: req.user._id, "element._id": doc._id, referenceTo: "document"})
                .populate("fromUser", "_id name email").exec(function(err, notifications) {
                    if (err) {cb(err);}
                    else {
                        doc.__v = notifications.length;
                        cb();
                    }
                });
            }, function() {
                return res.send(200, document);
            });
        }
    });
};

exports.me = function(req, res) {
    var roles = config.roles;
    var condition = {};
    if (req.params.id!=="me") {
        condition = {project: req.params.id, $or: [{owner: req.user._id}, {members: req.user._id}]};
    } else {
        condition = {$or: [{owner: req.user._id}, {members: req.user._id}]};
    }
    Document.find(condition)
    .populate("documents")
    .populate("owner", "_id name email phoneNumber")
    .populate("members", "_id name email phoneNumber")
    .exec(function(err, documents) {
        if (err) {return res.send(500,err);}
        async.each(documents, function(document, callback) {
            async.parallel([
                // check if current user is document set owner or belong to owner team
                // then show all member of document set
                function (cb) {
                    People.findOne({project: document.project}, function(err, people) {
                        if (err || !people) {
                            cb();
                        } else {
                            var isOwnerTeam = false;
                            _.each(roles, function(role) {
                                _.each(people[role], function(tender) {
                                    if (tender.hasSelect && tender.tenderers[0]._id) {
                                        var currentTeamMembers = tender.tenderers[0].teamMember;
                                        currentTeamMembers.push(tender.tenderers[0]._id);

                                        var index = _.findIndex(currentTeamMembers, function(member) {
                                            return member.toString()===document.owner._id.toString();
                                        });
                                        if (index !== -1) {
                                            _.each(currentTeamMembers, function(member) {
                                                if (member.toString()===req.user._id.toString()) {
                                                    isOwnerTeam = true;
                                                    return false;
                                                }
                                            });
                                            return false;
                                        }
                                    }
                                });
                                if (isOwnerTeam) {
                                    return false;
                                }
                            });
                            if (!isOwnerTeam) {
                                document.members = [];
                                document.notMembers = [];
                            }
                            cb();
                        }
                    });
                }, 
                // Get all unread notifications related to current user
                function (cb) {
                    async.each(document.documents, function(doc, cb) {
                        Notification.find({unread: true, owner: req.user._id, "element._id": doc._id, referenceTo: "document"})
                        .populate("fromUser", "_id name email").exec(function(err, notifications) {
                            if (err) {cb(err);}
                            else {
                                if (notifications.length > 0) {
                                    var latestNotification = _.last(notifications);
                                    doc.element.notificationType = latestNotification.type;
                                    doc.element.notificationBy = latestNotification.fromUser;
                                }
                                doc.__v = notifications.length;
                                cb();
                            }
                        });
                    },cb);
                }
            ], callback);
        }, function() {
            var result = [];
            if (req.params.id!=="me") {
                _.each(documents, function(set) {
                    var totalChangeOfSet = 0;
                    _.each(set.documents, function(doc) {
                        if (doc.__v > 0) {
                            totalChangeOfSet += 1;
                        }
                    });
                    set.__v = totalChangeOfSet;
                });
                return res.send(200, documents);
            } else {
                // Get all document set by selected project for ionic app
                _.each(documents, function(document) {
                    var docs = [];
                    _.each(document.documents, function(doc) {
                        if (doc.__v > 0) {
                            docs.push(doc);
                        }
                    });
                    document.documents = docs;
                    document.__v = document.documents.length;
                    if (document.__v > 0) {
                        result.push(document);
                    }
                });
                return res.send(200, result);
            }
        });
    });
};

exports.create = function(req, res) {
    var data = req.body;
    if (!data.name) {
        return res.send(442, {msg: "Document name is required"});
    }
    var document = new Document({
        owner: req.user._id,
        name: data.name,
        project: req.params.id
    });
    if (req.query.isCopy) {
        document.documents = [];
        _.each(data.documents, function(doc) {
            document.documents.push(doc._id);
        }); 
    }
    CheckMembers.check(data.newMembers, null, function(result) {
        document.members = result.members;
        document.notMembers = result.notMembers;
        document.save(function(err) {
            if (err) {return res.send(500,err);}
            Document.populate(document, [
                {path: "owner", select: "_id name email phoneNumber"},
                {path: "members", select: "_id name email phoneNumber"},
                {path: "documents", select: "_id name tags project __v"}
            ], function() {
                var members = document.members;
                members.push(document.owner);
                _.each(members, function(member) {
                    EventBus.emit('socket:emit', {
                        event: 'document-set:new',
                        room: member._id.toString(),
                        data: document
                    });
                });
                return res.send(200, document);
            });
        });
    });
};

exports.update = function(req, res) {
    var data = req.body;
    Document.findById(req.params.id, function(err, document) {
        if (err) 
            return res.send(500);
        if (!document) 
            return res.send(404);
        if (document.archive && data.editType!=="unarchive") {
            return res.send(500, {msg: "This Document Set Was Archived"});
        }
        if (data.editType==="unarchive" && (!data.newMembers || data.newMembers.length === 0)) {
            return res.send(500, {msg: "Please Select At Least 1 Member"});
        }
        async.parallel([
            // Update document set name while new data not the same as old
            function (cb) {
                if (data.name && data.name.trim()!==document.name.trim()) {
                    document.name = data.name;
                    cb();
                } else {
                    cb();
                }
            },
            // Update document set member while existed new members
            function (cb) {
                if (data.newMembers && data.newMembers.length > 0) {
                    CheckMembers.check(data.newMembers, document, function(result) {
                        document.members = result.members;
                        document.notMembers = result.notMembers;
                        cb();
                    });
                } else {
                    cb();
                }
            },
            function (cb) {
                if (data.editType==="archive" || data.editType==="unarchive") {
                    document.archive = (data.editType==="archive") ? true : false;
                    if (data.editType==="archive") {
                        document.members = [];
                        document.notMembers = [];
                        cb();
                    } else {
                        CheckMembers.check(data.newMembers, document, function(result) {
                            document.members = result.members;
                            document.notMembers = result.notMembers;
                            cb();
                        });
                    }
                } else {
                    cb();
                }
            }
        ], function() {
            document.save(function(err) {
                if (err) 
                    return res.send(500,err);
                Document.populate(document, [
                    {path: "owner", select: "_id name email phoneNumber"},
                    {path: "members", select: "_id name email phoneNumber"},
                    {path: "documents", select: "_id name tags project __v"}
                ], function() {
                    document.__v = 0;
                    async.each(document.documents, function(doc, cb) {
                        Notification.find({unread: true, owner: req.user._id, "element._id": doc._id, referenceTo: "document"})
                        .populate("fromUser", "_id name email").exec(function(err, notifications) {
                            if (err) {cb(err);}
                            else {
                                doc.__v = notifications.length;
                                if (doc.__v > 0) {
                                    document.__v +=1;
                                }
                                cb();
                            }
                        });
                    },function() {
                        var members = _.clone(document.members);
                        members.push(document.owner);
                        _.each(members, function(member) {
                            EventBus.emit('socket:emit', {
                                event: 'document-set:update',
                                room: member._id.toString(),
                                data: document
                            });
                        });
                        return res.send(200);
                    });
                });
            });
        });
    });
};