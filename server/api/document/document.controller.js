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
    .populate("members", "_id name email phoneNumber")
    .exec(function(err, documents) {
        if (err) {return res.send(500,err);}
        async.each(documents, function(document, callback) {
            async.parallel([
                function (cb) {
                    People.findOne({project: document.project}, function(err, people) {
                        if (err || !people) {
                            cb();
                        } else {
                            var isOwnerTeam = false;
                            if (document.owner.toString()!==req.user._id.toString()) {
                                console.log("AAAAAAAA");
                                _.each(roles, function(role) {
                                    _.each(people[role], function(tender) {
                                        if (tender.tenderers[0]._id && tender.tenderers[0]._id.toString()===document.owner.toString() && tender.tenderers[0]._id.toString()===req.user._id.toString()) {
                                            isOwnerTeam = true;
                                            return false;
                                        } else if (tender.tenderers[0].teamMember.indexOf(req.user._id.toString()) !== -1 && (tender.tenderers[0]._id && tender.tenderers[0]._id.toString()===document.owner.toString())) {
                                            isOwnerTeam = true;
                                            return false;
                                        }
                                    });
                                    if (isOwnerTeam) {
                                        return false;
                                    }
                                });
                            } else if (document.owner.toString()===req.user._id.toString()) {
                                console.log("BBBBBBBBb");
                                isOwnerTeam = true;
                            }
                            console.log(isOwnerTeam);
                            if (!isOwnerTeam) {
                                document.members = [];
                                document.notMembers = [];
                            }
                            cb();
                        }
                    });
                }, 
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
        else if (!document) 
            return res.send(404);
        document.name = data.name;
        CheckMembers.check(data.newMembers, document, function(result) {
            document.members = result.members;
            document.notMembers = result.notMembers;
            document.save(function(err) {
                if (err) 
                    return res.send(500,err);
                Document.populate(document, [
                    {path: "owner", select: "_id name email phoneNumber"},
                    {path: "members", select: "_id name email phoneNumber"},
                    {path: "documents", select: "_id name tags project __v"}
                ], function() {
                    var members = document.members;
                    members.push(document.owner);
                    _.each(members, function(member) {
                        EventBus.emit('socket:emit', {
                            event: 'document-set:update',
                            room: member._id.toString(),
                            data: document
                        });
                    });
                    return res.send(200, document);
                });
            });
        });
    });
};