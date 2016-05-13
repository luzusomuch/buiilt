'use strict';
var User = require('./../../models/user.model');
var File = require('./../../models/file.model');
var Document = require('./../../models/document.model');
var People = require('./../../models/people.model');
var Project = require('./../../models/project.model');
var Notification = require('./../../models/notification.model');
var RelatedItem = require('../../components/helpers/related-item');
var _ = require('lodash');
var async = require('async');
var s3 = require('../../components/S3');
var mongoose = require('mongoose');
var EventBus = require('../../components/EventBus');

function populateFile(file, res){
    File.populate(file, [
        {path: "owner", select: "_id email name phoneNumber"},
        {path: "members", select: "_id email name phoneNumber"},
        {path: "activities.user", select: "_id email name"},
        {path: "activities.acknowledgeUsers._id", select: "_id email name"}
    ], function(err, file) {
        if (file.element.type === "file") {
            EventBus.emit('socket:emit', {
                event: 'file:update',
                room: file._id.toString(),
                data: JSON.parse(JSON.stringify(file))
            });
        } else {
            EventBus.emit('socket:emit', {
                event: 'document:update',
                room: file._id.toString(),
                data: JSON.parse(JSON.stringify(file))
            });
        }
        return res.send(200, file);
    });
};

function populateNewFile(file, res) {
    File.populate(file, [{path: "project"}], function(err, file) {
        return res.send(200,file);
    });
};

exports.create = function(req, res) {
    var data = req.body;
    if (data.type==="document" && !data.selectedDocumentSetId) {
        return res.send(422, {msg: "Please select a document set"});
    }
    var file = new File({
        owner: req.user._id,
        project: req.params.id,
        description: data.description,
        members: [],
        notMembers: [],
        element: {type: data.type},
        tags: _.map(data.tags, "name")
    });
    if (data.type==="file") {
        file.name = "Untitled File";
    } else if (data.type==="document") {
        file.name = "Untitled Document";
    } 
    file.documentSet = data.selectedDocumentSetId;
    file.event = data.selectedEvent;
    file.save(function(err) {
        if (err) {return res.send(500,err);}
        if (file.element.type==="document" && data.selectedDocumentSetId) {
            Document.findById(data.selectedDocumentSetId, function(err, document) {
                if (err || !document) {
                    file.remove(function() {
                        return res.send(500,err);
                    });
                } else {
                    document.documents.push(file._id);
                    document.save(function() {
                        populateNewFile(file,res);
                    });
                }
            });
        } else {
            populateNewFile(file,res);
        }
    });
};

/*
    assign more members to a document reversion
    request params id and query activityAndHisToryId
*/
exports.assignMoreMembers = function(req, res) {
    File.findById(req.params.id, function(err, file) {
        if (err) {return res.send(500,err);}
        if (!file) {return res.send(404,err);}
        var activityIndex = _.findIndex(file.activities, function(activity) {
            if (activity.activityAndHisToryId) 
                return activity.activityAndHisToryId===req.query.activityAndHisToryId;
        });
        var historyIndex = _.findIndex(file.fileHistory, function(history) {
            if (history.activityAndHisToryId) 
                return history.activityAndHisToryId===req.query.activityAndHisToryId;
        });
        var newMembers = [];
        if (historyIndex !== -1 && activityIndex !== -1) {
            _.each(req.body, function(member) {
                if (member._id) {
                    file.activities[activityIndex].members.push({_id: member._id});
                    file.activities[activityIndex].acknowledgeUsers.push({_id: member._id, isAcknow: false});
                    file.fileHistory[historyIndex].members.push({_id: member._id});
                    newMembers.push(member._id);
                } else {
                    file.activities[activityIndex].members.push({email: member.email});
                    file.activities[activityIndex].acknowledgeUsers.push({email: member.email, isAcknow: false});
                    file.fileHistory[historyIndex].members.push({email: member.email});
                }
            });
        }
        file.save(function(err) {
            if (err) {return res.send(500,err);}
            File.populate(file, [
                {path: "owner", select: "_id email name phoneNumber"},
                {path: "members", select: "_id email name phoneNumber"},
                {path: "activities.user", select: "_id email name"},
                {path: "activities.acknowledgeUsers._id", select: "_id email name"},
                {path: "project"}
            ], function(err, file) {
                EventBus.emit('socket:emit', {
                    event: 'document:update',
                    room: file._id.toString(),
                    data: JSON.parse(JSON.stringify(file))
                });
                // var uniqId = mongoose.Types.ObjectId();
                // _.each(newMembers, function(user) {
                //     EventBus.emit('socket:emit', {
                //         event: 'dashboard:new',
                //         room: user.toString(),
                //         data: {
                //             type: file.element.type,
                //             _id: file._id,
                //             uniqId: uniqId,
                //             user: req.user,
                //             file: JSON.parse(JSON.stringify(file)),
                //             newNotification: {fromUser: req.user, type: "document-upload-reversion"}
                //         }
                //     });
                // });
                return res.send(200, file);
            });
        });
    });
};

/*
    Update last access time of current user to file or document to show it first
*/
exports.lastAccess = function(req, res) {
    File.findById(req.params.id, function(err, file) {
        if (err) {return res.send(500,err);}
        if (!file) {
            return res.send(404);
        }
        if (file.lastAccess && file.lastAccess.length > 0) {
            var index = _.findIndex(file.lastAccess, function(access) {
                return access.user.toString()===req.user._id.toString();
            });
            if (index !== -1) {
                file.lastAccess[index].time = new Date();
            } else {
                file.lastAccess.push({user: req.user._id, time: new Date()});
            }
        } else {
            file.lastAccess = [{user: req.user._id, time: new Date()}];
        }
        file.save(function(err) {
            if (err) {return res.send(500,err);}
            return res.send(200);
        });
    });
};

/*
    get files, documents, tender files list by selected project
    request params type
*/
exports.getFilesByProject = function(req, res) {
    var query;
    var userId = (req.query.userId && req.user.role==="admin") ? req.query.userId : req.user._id;
    if (req.params.type === "file") {
        query = {project: req.params.id, 'element.type': 'file', $or: [{owner: userId}, {members: userId}]};
    } else if (req.params.type === "document") {
        query = {project: req.params.id, "element.type": "document", $or:[{"fileHistory.members._id": userId},{owner: userId}]};
    } else if (req.params.type === "tender") {
        query = {project: req.params.id, "element.type": "tender", "belongTo.item._id": mongoose.Types.ObjectId(req.query.tenderId)};
    }
    File.find(query)
    .populate("owner", "_id name email phoneNumber")
    .populate("project")
    .populate("members", "_id name email phoneNumber").exec(function(err, files) {
        if (err) {return res.send(500,err);}
        async.each(files, function(file, cb) {
            Notification.find({unread: true, owner: userId, "element._id": file._id, referenceTo: req.params.type, $or:[{type: "document-upload-reversion"}, {type: "file-upload-reversion"}, {type: "related-item"}]})
            .populate("fromUser", "_id name email").exec(function(err, notifications) {
                if (err) {cb(err);}
                else {
                    if (notifications.length > 0) {
                        var latestNotification = _.last(notifications);
                        file.element.notificationType = latestNotification.type;
                        file.element.notificationBy = latestNotification.fromUser;
                    }
                    file.__v = notifications.length;
                    cb();
                }
            });
        }, function(err){
            if (err) {return res.send(500,err);}
            if (req.params.type==="document") {
                var result = [];
                _.each(files, function(file) {
                    if (!file.documentSet) {
                        result.push(file);
                    }
                });
                return res.send(200, result);
            } else {
                return res.send(200,files);
            }
        });
    });
};  

/*
    get file, document, tender file by id
*/
exports.show = function(req, res) {
    File.findById(req.params.id)
    .populate("owner", "_id name email phoneNumber")
    .populate("members", "_id name email phoneNumber")
    .populate("activities.user", "_id name email")
    .populate("activities.acknowledgeUsers._id", "_id name email")
    .exec(function(err, file) {
        if (err) 
            return res.send(500, err);
        Notification.find({"element._id": file._id, owner: req.user._id, unread: true}, function(err, notifications) {
            if (err) {return res.send(500,err);}
            file.__v = notifications.length;
            if (file.element.type==="document"&&file.owner._id.toString()!==req.user._id.toString()) {
                var fileHistory = [];
                _.each(file.fileHistory, function(h) {
                    if (_.findIndex(h.members, function(m) {
                        if (m._id) {
                            return m._id.toString()===req.user._id.toString();
                        }
                    }) !== -1) {
                        fileHistory.push(h);
                    }
                });
                file.fileHistory = fileHistory;
            }
            RelatedItem.responseWithRelated("file", file, req.user, res);
        });
    });
};

/*
    Update the selected file belong to editType
    file content, assign member, insert note, archive or unarchive file
*/
exports.update = function(req, res) {
    var data = req.body;
    File.findById(req.params.id, function(err, file) {
        if (err) {return res.send(500,err);}
        else if (!file) {return res.send(404, "We Can Not Find The Requested File...");}
        else if (req.body.editType !== "unarchive" && file.isArchive) {return res.send(500, {message: "This file is archived"});}
        else {
            var activity = {
                user: req.user._id,
                type: req.body.editType,
                createdAt: new Date(),
                element: {}
            };
            async.parallel([
                function(cb) {
                    if (data.editType === "edit") {
                        if (data.selectedTag) {
                            activity.element.tags = [data.selectedTag];
                            file.tags = [data.selectedTag];
                        } 
                        if (data.name && data.name !== file.name) {
                            activity.element.name = (file.name.length !== data.name.length) ? data.name : null;
                            file.name = data.name;
                        }
                        cb();
                    } else if (data.editType === "assign") {
                        var members = [];
                        async.each(data.newMembers, function(member, cb) {
                            members.push(member.email);
                            User.findOne({email: member.email}, function(err, user) {
                                if (err) {cb();}
                                else if (!user) {
                                    file.notMembers.push(member.email);
                                    cb();
                                } else {
                                    file.members.push(user._id);
                                    cb();
                                }
                            });
                        }, function() {
                            activity.element.members = members;
                            cb();
                        });
                    } else if (data.editType==="insert-note") {
                        activity.element.content = req.body.note;
                        file._editType="insert-note";
                        cb();
                    } else if (data.editType==="archive" || data.editType==="unarchive") {
                        file.isArchive=req.body.isArchive;
                        file._editType=data.editType;
                        cb();
                    } else if (data.editType==="change-event" || data.editType==="add-event") {
                        file.event = data.selectedEvent;
                        cb()
                    } else {
                        cb();
                    }
                }
            ], function(err, result) {
                if (err) {return res.send(500,err);}
                file.activities.push(activity);
                file._editUser =  req.user;
                file.save(function(err) {
                    if (err) {return res.send(500,err);}
                    File.populate(file, [
                        {path: "owner", select: "_id email name phoneNumber"},
                        {path: "members", select: "_id email name phoneNumber"},
                        {path: "activities.user", select: "_id email name"},
                        {path: "activities.acknowledgeUsers._id", select: "_id email name"},
                        {path: "project"}
                    ], function(err, file) {
                        if (file.element.type === "file") {
                            if (file.isArchive) {
                                file.members.push(file.owner);
                                _.each(file.members, function(member) {
                                    EventBus.emit('socket:emit', {
                                        event: 'file:archive',
                                        room: member._id.toString(),
                                        data: JSON.parse(JSON.stringify(file))
                                    });
                                });
                            } else {
                                EventBus.emit('socket:emit', {
                                    event: 'file:update',
                                    room: file._id.toString(),
                                    data: JSON.parse(JSON.stringify(file))
                                });
                                // var owners = _.clone(file.members);
                                // owners.push(file.owner);
                                // _.remove(owners, {_id: req.user._id});
                                // var uniqId = mongoose.Types.ObjectId();
                                // _.each(owners, function(owner) {
                                //     EventBus.emit('socket:emit', {
                                //         event: 'dashboard:new',
                                //         room: owner._id.toString(),
                                //         data: {
                                //             type: file.element.type,
                                //             _id: file._id,
                                //             uniqId: uniqId,
                                //             user: req.user,
                                //             file: JSON.parse(JSON.stringify(file)),
                                //             newNotification: {fromUser: req.user, type: "document-upload-reversion"}
                                //         }
                                //     });
                                // });
                            }
                        } else {
                            if (file.isArchive) {
                                var members = [];
                                _.each(file.fileHistory, function(history) {
                                    _.each(history.members, function(member) {
                                        if (member._id) {
                                            members.push(member._id);
                                        }
                                    });
                                });
                                members.push(req.user._id);
                                members = _.uniq(members);
                                _.each(members, function(member) {
                                    EventBus.emit('socket:emit', {
                                        event: 'document:archive',
                                        room: member.toString(),
                                        data: JSON.parse(JSON.stringify(file))
                                    });
                                });
                            } else {
                                EventBus.emit('socket:emit', {
                                    event: 'document:update',
                                    room: file._id.toString(),
                                    data: JSON.parse(JSON.stringify(file))
                                });
                            }
                        }

                        RelatedItem.responseWithRelated("file", file, req.user, res);
                    });
                });
            });
        }
    });
};

/*
    send acknowledgement to the owner
*/
exports.acknowledgement = function(req, res) {
    File.findById(req.params.id, function(err, file) {
        if (err) {return res.send(500,err);}
        else if (!file) {return res.send(404);}
        if (file.element.type === "file") {
            file.members.push(file.owner);
            if (_.findIndex(file.members, function(id) {
                return id.toString()===req.user._id.toString();
            }) === -1) {
                return res.send(500, {message: "You haven\'t got privilege"});
            }
        }
        var currentActivityIndex = _.findIndex(file.activities, function(activity) {
            return activity._id.toString()===req.query.activityId.toString();
        });
        if (currentActivityIndex !== -1) {
            if (file.activities[currentActivityIndex].type === "upload-file" || file.activities[currentActivityIndex].type==="upload-reversion") {
                var userIndex = _.findIndex(file.activities[currentActivityIndex].acknowledgeUsers, function(user) {
                    if (user._id) {
                        return user._id.toString()===req.user._id.toString();
                    }
                });
                if (userIndex !== -1) {
                    file.activities[currentActivityIndex].acknowledgeUsers[userIndex].isAcknow = true;
                } else {
                    file.activities[currentActivityIndex].acknowledgeUsers.push({_id: req.user._id, isAcknow: true});
                }
                file._editType="sendAcknowledge";
                file._editUser = req.user;
                file.save(function(err) {
                    if (err) {return res.send(500,err);}
                    populateFile(file, res);
                });
            } else {
                return res.send(500, {message: "Acitivity is not existed"});    
            }
        } else {
            return res.send(500, {message: "Acitivity is not existed"});
        }
    });
};

/*
    Delete file
    request admin role
*/
exports.deleteFile = function(req, res) {
    File.findByIdAndRemove(req.params.id, function(err, file) {
        if (err) {return res.send(500,err);}
        return res.send(200);
    });
};

/*
    Get files or documents list for current user which unread notification
*/
exports.myFiles = function(req, res) {
    var result = [];
    var notifications = [];
    var files = [];
    Notification.find({owner: req.user._id, unread: true, $or:[{referenceTo: 'file'}, {referenceTo: 'document'}]})
    .populate("fromUser", "_id name email").exec(function(err, notifications) {
        if (err) {return res.send(500,err);}
        notifications = notifications;
        async.each(notifications, function(notification, cb) {
            File.findById(notification.element._id)
            .populate("members", "_id name email")
            .populate("project")
            .exec(function(err, file) {
                if (err || !file) {cb();}
                else {
                    files.push(file);
                    cb();
                }
            });
        }, function(err) {
            if (err) {return res.send(500,err);}
            var uniqueFilesList = _.map(_.groupBy(files,function(doc){
                return doc._id;
            }),function(grouped){
              return grouped[0];
            });
            _.each(uniqueFilesList, function(file) {
                file.element.notifications = [];
                file.element.limitNotifications = [];
                var index = 1;
                _.each(notifications, function(notification) {
                    if (notification.element._id.toString()===file._id.toString()) {
                        file.element.notifications.push({
                            fromUser: notification.fromUser,
                            type: notification.type
                        });
                        if (index === 1) {
                           file.element.limitNotifications.push({
                                fromUser: notification.fromUser,
                                type: notification.type
                            }); 
                        }
                        index += 1;
                    }
                });
                if (file.element.type==="document"&&file.owner.toString()!==req.user._id.toString()) {
                    var fileHistory = [];
                    _.each(file.fileHistory, function(h) {
                        if (_.findIndex(h.members, function(m) {
                            if (m._id) {
                                return m._id.toString()===req.user._id.toString();
                            }
                        }) !== -1) {
                            fileHistory.push(h);
                        }
                    });
                    file.fileHistory = fileHistory;
                }
            });
            return res.send(200, uniqueFilesList);
        });
    });
};