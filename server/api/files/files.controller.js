'use strict';
var User = require('./../../models/user.model');
var File = require('./../../models/file.model');
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
        {path: "owner", select: "_id email name"},
        {path: "members", select: "_id email name"},
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
                {path: "owner", select: "_id email name"},
                {path: "members", select: "_id email name"},
                {path: "activities.user", select: "_id email name"},
                {path: "activities.acknowledgeUsers._id", select: "_id email name"},
                {path: "project"}
            ], function(err, file) {
                EventBus.emit('socket:emit', {
                    event: 'document:update',
                    room: file._id.toString(),
                    data: JSON.parse(JSON.stringify(file))
                });
                var uniqId = mongoose.Types.ObjectId();
                _.each(newMembers, function(user) {
                    EventBus.emit('socket:emit', {
                        event: 'dashboard:new',
                        room: user.toString(),
                        data: {
                            type: "file",
                            _id: file._id,
                            uniqId: uniqId,
                            user: req.user,
                            file: JSON.parse(JSON.stringify(file)),
                            newNotification: {fromUser: req.user, type: "document-upload-reversion"}
                        }
                    });
                });
                return res.send(200, file);
            });
        });
    });
};

exports.lastAccess = function(req, res) {
    File.findById(req.params.id, function(err, file) {
        if (err) {return res.send(500,err);}
        if (!file) {
            return res.send(404);
        }
        if (file.lastAccess && file.lastAccess.length > 0) {
            var index = _.findIndex(file.lastAccess, function(access) {
                access.user.toString()===req.user._id.toString();
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
    .populate("owner", "_id name email")
    .populate("project")
    .populate("members", "_id name email").exec(function(err, files) {
        if (err) {return res.send(500,err);}
        async.each(files, function(file, cb) {
            Notification.find({unread: true, owner: userId, "element._id": file._id, referenceTo: req.params.type})
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
            _.each(files, function(file) {
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
            });
            return res.send(200,files);
        });
    });
};  

exports.show = function(req, res) {
    File.findById(req.params.id)
    .populate("owner", "_id name email")
    .populate("members", "_id name email")
    .populate("activities.user", "_id name email")
    .populate("activities.acknowledgeUsers._id", "_id name email")
    .exec(function(err, file) {
        if (err) 
            return res.send(500, err);
        Notification.find({"element._id": file._id, owner: req.user._id, unread: true}, function(err, notifications) {
            if (err) {return res.send(500,err);}
            file.__v = notifications.length;
            if (file.element.type==="document"&&file.owner._id.toString()===req.user._id.toString()) {
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

exports.update = function(req, res) {
    var data = req.body;
    File.findById(req.params.id, function(err, file) {
        if (err) {return res.send(500,err);}
        else if (!file) {return res.send(404, "We Can Not Find The Requested File...");}
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
                        var tags = [];
                        _.each(data.tags, function(tag) {
                            tags.push(tag.name);
                        });
                        activity.element.name = (file.name.length !== data.name.length) ? data.name : null;
                        activity.element.description = (file.description && file.description.length !== data.description.length) ? data.description : null;
                        activity.element.tags = (file.tags.length !== data.tags.length) ? data.tags : null;
                        file.name = data.name;
                        file.description = data.description;
                        file.tags = tags;
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
                        file._editType = "insert-note";
                        cb();
                    } else if (data.editType==="archive" || data.editType==="unarchive") {
                        file.isArchive=req.body.isArchive;
                        file._editType=data.editType;
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
                        {path: "owner", select: "_id email name"},
                        {path: "members", select: "_id email name"},
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
                                var owners = _.clone(file.members);
                                owners.push(file.owner);
                                _.remove(owners, {_id: req.user._id});
                                var uniqId = mongoose.Types.ObjectId();
                                _.each(owners, function(owner) {
                                    EventBus.emit('socket:emit', {
                                        event: 'dashboard:new',
                                        room: owner._id.toString(),
                                        data: {
                                            type: "file",
                                            _id: file._id,
                                            uniqId: uniqId,
                                            user: req.user,
                                            file: JSON.parse(JSON.stringify(file)),
                                            newNotification: {fromUser: req.user, type: "document-upload-reversion"}
                                        }
                                    });
                                });
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
                file._editType = "sendAcknowledge";
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
        // _.each(file.activities, function(activity) {
        //     if (activity.type === "upload-file" || activity.type === "upload-reversion") {
        //         var index = _.findIndex(activity.acknowledgeUsers, function(user) {
        //             return user._id.toString()===req.user._id.toString();
        //         });
        //         if (index !== -1) {
        //             activity.acknowledgeUsers[index].isAcknow = true;
        //         }
        //     }
        // });
        // file.save(function(err) {
        //     if (err) {return res.send(500,err);}
        //     populateFile(file, res);
        // });
    });
};

exports.acknowledgementViaEmail = function(req, res) {
    File.findById(req.params.id, function(err, file) {
        if (err) {return res.send(500,err);}
        else if (!file) {return res.send(404);}
        if (file.element.type === "file") {
            if (_.indexOf(file.notMembers, req.params.email) === -1) {
                return res.send(500, {message: "You Do Not Have Permissions To Perform This Action."});
            }
        }
        var index = _.findIndex(file.activities, function(activity) {
            return activity._id.toString()===req.params.activityId.toString();
        });
        if (index !== -1) {
            _.each(file.activities[index].acknowledgeUsers, function(user){
                if (user.email===req.params.email) {
                    user.isAcknow = true;
                }
            });
        }
        file.save(function(err) {
            if (err) {return res.send(500,err);}
            File.populate(file, [
                {path: "owner", select: "_id email name"},
                {path: "members", select: "_id email name"},
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
                return res.redirect(file.path);
            });
        });
    });
};

exports.interested = function(req, res) {
    File.findById(req.body.id, function(err, file) {
        if (err) {return res.send(500, err);}
        else {
            if (req.body.isInterested == true) {
                _.remove(file.usersInterestedIn, {_id: req.user._id});
            }
            else {
                file.usersInterestedIn.push({_id: req.user._id});
            }
            file.markModified('usersInterestedIn');
            file.save(function(err, savedFile) {
                if (err) {return res.send(500, err);}
                else {
                    return res.json(savedFile);
                }
            });
        }
    });
};

exports.getFileByStateParam = function(req, res) {
    File.find({'belongTo': req.params.id}, function(err, files) {
        if (err) {return res.send(500,err)}
        else {
            return res.json(200,files);
        }
    });
};

exports.getFileByStateParamIos = function(req, res) {
    var result = [];
    File.find({'belongTo': req.params.id}, function(err, files) {
        if (err) {return res.send(500,err)}
        else {
            async.each(files, function(file, cb){
                var query = Notification.find(
                    {owner : req.user._id,unread : true, type : 'uploadNewDocumentVersion','element.file._id' : file._id }
                );
                query.distinct('element.file._id');

                query.exec(function(err, fileNotifications) {
                    if (err) {return cb(err);}
                    if (fileNotifications.length > 0) {
                        _.each(fileNotifications, function(fileNotification){
                            if (file._id.toString() == fileNotification.toString()) {
                                file.isNewNotification = true;
                                result.push(file);
                                cb();
                            }
                        });
                    }
                    else {
                        result.push(file);
                        cb()
                    }
                });
            }, function(err){
                if (err) {return res.send(500,err);}
                return res.json(200,result);
            });
        }
    });
};

exports.downloadFile = function(req, res) {
    File.findById(req.params.id, function(err, file){
        if (err) {return res.send(500,err);}
        else {
            var fileUrl = {url: s3.getPublicUrl(file.name)};
            return res.json(200,fileUrl);
        }
    });
};

exports.downloadAll = function(req, res) {
    File.find({belongTo:req.params.id}, function(err, files){
        if (err) {return res.send(500,err);}
        else {
            var listFileUrls = [];
            _.each(files, function(file){
                var fileUrl = {url: s3.getPublicUrl(file.name)};    
                listFileUrls.push(fileUrl);
            });
            return res.json(200,listFileUrls);
        }
    });
};

exports.getAll = function(req, res) {
    File.find({}, function(err, files){
        if (err) {return res.send(500,err);}
        return res.json(200,files)
    })
};

exports.getFileByPackage = function(req, res) {
    File.find({belongTo: req.params.id, belongToType: req.params.type}, function(err, files){
        if (err) {return res.send(500,err);}
        if (!files) {return res.send(404);}
        return res.send(200,files);
    });
};

exports.deleteFile = function(req, res) {
    File.findByIdAndRemove(req.params.id, function(err, file) {
        if (err) {return res.send(500,err);}
        return res.send(200);
    });
};

exports.sendToDocument = function(req, res) {
    File.findById(req.params.id, function(err, file){
        if (err) {return res.send(500,err);}
        if (!file) {return res.send(404);}
        File.findOne({belongTo: req.body.projectId, isSendToDocumentation: true, wasBelongTo: req.body.package}, function(err, _file){
            if (err) {return res.send(500,err);}
            if (!_file) {
                var newFile = new File({
                    documentDesignId: mongoose.Types.ObjectId(file._id.toString()),
                    wasBelongTo: file.belongTo,
                    isSendToDocumentation: true,
                    belongTo: req.body.projectId,
                    belongToType: file.belongToType,
                    size: file.size,
                    description: file.description,
                    mimeType: file.mimeType,
                    path: file.path,
                    user: file.user,
                    server: file.server,
                    name: file.name,
                    title: file.title,
                    isQuote: file.isQuote,
                    tags: file.tags,
                    usersInterestedIn: file.usersInterestedIn,
                    usersRelatedTo: file.usersInterestedIn,
                    version: 0
                });
                newFile.save(function(err){
                    if (err) {return res.send(500,err);}
                    return res.send(200, newFile);
                });
            } else {
                _file.documentDesignId = mongoose.Types.ObjectId(file._id.toString());
                _file.wasBelongTo = file.belongTo;
                _file.isSendToDocumentation = true;
                _file.belongTo = req.body.projectId;
                _file.belongToType = file.belongToType;
                _file.size = file.size;
                _file.description = file.description;
                _file.mimeType = file.mimeType;
                _file.path = file.path;
                _file.user = file.user;
                _file.server = file.server;
                _file.name = file.name;
                _file.title = file.title;
                _file.isQuote = file.isQuote;
                _file.tags = file.tags;
                _file.usersInterestedIn = file.usersInterestedIn;
                _file.usersRelatedTo = file.usersInterestedIn;
                _file.version = file.version + 1;

                _file.save(function(err){
                    if (err) {return res.send(500,err);}
                    return res.send(200,_file);
                });
            }
        });
    });
};

exports.getAllByUser = function(req, res) {
    Notification.find({owner: req.user._id, unread: true, $or:[{type: 'uploadNewDocumentVersion'},{type: 'uploadDocument'}]}, function(err, documents){
        if (err) {return res.send(500,err);}
        return res.send(200,documents);
    });
};

exports.getInPeople = function(req, res) {
    File.find({belongTo: req.params.id, belongToType: 'people'}, function(err, files){
        if (err) {return res.send(500,err);}
        return res.send(200,files);
    });
};

exports.getInBoard = function(req, res) {
    File.find({belongTo: req.params.id, belongToType: 'board'}, function(err, files){
        if (err) {return res.send(500,err);}
        return res.send(200,files);
    });
};

exports.getInProject = function(req, res) {
    File.find({belongTo: req.params.id, belongToType: 'project'}, function(err, files){
        if (err) {return res.send(500,err);}
        return res.send(200,files);
    });
};

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