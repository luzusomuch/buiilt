'use strict';

var User = require('./../../models/user.model');
var Activity = require('./../../models/activity.model');
var People = require('./../../models/people.model');
var Team = require('./../../models/team.model');
var Project = require('./../../models/project.model');
var File = require('./../../models/file.model');
var Document = require('./../../models/document.model');
var Notification = require('./../../models/notification.model');
var NotificationHelper = require('./../../components/helpers/notification');
var CheckMembers = require("./../../components/helpers/checkMembers");
var _ = require('lodash');
var async = require('async');
var config = require('./../../config/environment');
var EventBus = require('../../components/EventBus');
var mongoose = require("mongoose");
var formidable = require('formidable');
var s3 = require('../../components/S3');

var getMainItem = function(type) {
    var _item = {};
    switch (type) {
        case 'thread' :
            _item = Thread;
            break;
        case 'task' :
            _item = Task;
            break;
        case 'file':
            _item = File;
            break;
        default :
            break;
    }
    return _item;
};

function populateThread(thread, res){
    Thread.populate(thread, [
        {path: "owner", select: "_id email name"},
        {path: "messages.user", select: "_id email name"},
        {path: "messages.mentions", select: "_id email name"},
        {path: "members", select: "_id email name"},
        {path: "activities.user", select: "_id email name"}
    ], function(err, thread) {
        return res.send(200, thread);
    });
};

function populateTask(task, res){
    Task.populate(task, [
        {path: "owner", select: "_id email name"},
        {path: "members", select: "_id email name"},
        {path: "activities.user", select: "_id email name"}
    ], function(err, task) {
        return res.send(200, task);
    });
};

function populateFile(file, res){
    File.populate(file, [
        {path: "owner", select: "_id email name"},
        {path: "members", select: "_id email name"},
        {path: "activities.user", select: "_id email name"},
        {path: "project"}
    ], function(err, file) {
        return res.send(200, file);
    });
};

/*
    Upload file or document reversion
*/
exports.uploadReversion = function(req, res) {
    // var form = new formidable.IncomingForm();
    // form.parse(req, function(err, fields, files) {
    //     if (err) {return res.send(500,err);}
    //     else if (fields && files) {
    //         console.log(fields);
    //         console.log(files);
    //         File.findById(req.params.id, function(err, file) {
    //             if (err || !file) {
    //                 return res.send(500,err);
    //             } else {
    //                 var acknowledgeUsers = [];
    //                 async.parallel([
    //                     function (cb) {
    //                         if (file.element==="file" || file.element.type==="tender") {
    //                             _.each(file.members, function(member) {
    //                                 acknowledgeUsers.push({_id: member, isAcknow: false});
    //                             });
    //                             _.each(file.notMembers, function(member) {
    //                                 acknowledgeUsers.push({email: member, isAcknow: false});
    //                             });
    //                             acknowledgeUsers.push({_id: file.owner, isAcknow: false});
    //                             _.remove(acknowledgeUsers, {_id: req.user._id});
    //                             cb();
    //                         } else if (file.element.type==="document") {
    //                             if (file.documentSet) {
    //                                 Document.findById(file.documentSet, function(err, document) {
    //                                     if (err || !document) {
    //                                         cb(err);
    //                                     } else {
    //                                         _.each(document.members, function(member) {
    //                                             acknowledgeUsers.push({_id: member, isAcknow: false});
    //                                         });
    //                                         _.each(document.notMembers, function(email) {
    //                                             acknowledgeUsers.push({email: email, isAcknow: false});
    //                                         });
    //                                         cb();
    //                                     }
    //                                 });
    //                             } else {
    //                                 cb();
    //                             }
    //                         } else {
    //                             cb();
    //                         }
    //                     }
    //                 ], function(err) {
    //                     if (err) {return res.send(500,err);}
    //                     s3.uploadFile(files.file, function(err, data) {
    //                         if (err) {return res.send(500,err);}
    //                         else {
    //                             var activityAndHisToryId = mongoose.Types.ObjectId();
    //                             var path = s3.getPublicUrl(files.file.name);
    //                             var history = {
    //                                 link: path,
    //                                 version: files.file.name,
    //                                 createdAt: new Date(),
    //                                 activityAndHisToryId: activityAndHisToryId
    //                             };  
    //                             var activity = {
    //                                 type: "upload-reversion",
    //                                 user: req.user._id,
    //                                 createdAt: new Date(),
    //                                 acknowledgeUsers: acknowledgeUsers,
    //                                 element: {
    //                                     name: files.file.name,
    //                                 },
    //                                 activityAndHisToryId: activityAndHisToryId
    //                             };
    //                             if (file.element.type==="document") {
    //                                 activity.members = acknowledgeUsers;
    //                                 history.members = acknowledgeUsers;
    //                                 file.versionTags = fields.versionTags.split();
    //                                 history.versionTags = file.versionTags;
    //                                 activity.element.versionTags = file.versionTags;
    //                             } else {
    //                                 file.description = req.body.description;
    //                             }
    //                             file.event = (fields.selectedEvent) ? fields.selectedEvent : null;
    //                             file.path = path;
    //                             file.key = files.file.name;
    //                             file.mimeType = files.file.type;
    //                             file.size = files.file.size;
    //                             file.version = files.file.name;
    //                             file.fileHistory.push(history);
    //                             file.activities.push(activity);
    //                             file._editType = "uploadReversion";
    //                             file._editUser = req.user;
    //                             file.save(function(err) {
    //                                 File.populate(file, [
    //                                     {path: "owner", select: "_id email name"},
    //                                     {path: "members", select: "_id email name"},
    //                                     {path: "activities.user", select: "_id email name"},
    //                                     {path: "activities.acknowledgeUsers._id", select: "_id email name"},
    //                                     {path: "project"}
    //                                 ], function(err, file) {
    //                                     if (file.element.type === "file") {
    //                                         EventBus.emit('socket:emit', {
    //                                             event: 'file:update',
    //                                             room: file._id.toString(),
    //                                             data: JSON.parse(JSON.stringify(file))
    //                                         });
    //                                     } else {
    //                                         EventBus.emit('socket:emit', {
    //                                             event: 'document:update',
    //                                             room: file._id.toString(),
    //                                             data: JSON.parse(JSON.stringify(file))
    //                                         });
    //                                     }
    //                                     var randomId = mongoose.Types.ObjectId();
    //                                     _.each(acknowledgeUsers, function(user) {
    //                                         if (file.element.type === "file" && user._id) {
    //                                             EventBus.emit('socket:emit', {
    //                                                 event: 'dashboard:new',
    //                                                 room: user._id.toString(),
    //                                                 data: {
    //                                                     type: file.element.type,
    //                                                     _id: file._id,
    //                                                     uniqId: randomId,
    //                                                     user: req.user,
    //                                                     file: JSON.parse(JSON.stringify(file)),
    //                                                     newNotification: {randomId: randomId, fromUser: req.user, type: "file-upload-reversion"}
    //                                                 }
    //                                             });
    //                                         } else if (file.element.type === "document" && user._id) {
    //                                             EventBus.emit('socket:emit', {
    //                                                 event: 'dashboard:new',
    //                                                 room: user._id.toString(),
    //                                                 data: {
    //                                                     type: file.element.type,
    //                                                     _id: file._id,
    //                                                     uniqId: randomId,
    //                                                     user: req.user,
    //                                                     file: JSON.parse(JSON.stringify(file)),
    //                                                     newNotification: {randomId: randomId, fromUser: req.user, type: "document-upload-reversion"}
    //                                                 }
    //                                             });
    //                                         }
    //                                     });
    //                                     return res.send(200, file);
    //                                 });
    //                             });
    //                         }
    //                     });
    //                 });
    //             }
    //         })
    //     } else {
    //         return res.send(500);
    //     }
    // });
    var data = req.body.file;
    File.findById(req.params.id, function(err, file) {
        if (err) {return res.send(500,err);}
        else if (!file) {return res.send(404, "The specific file is not existed");}
        else {
            var acknowledgeUsers = [];
            async.parallel([
                function (cb) {
                    if (file.element.type==="file" || file.element.type==="tender") {
                        _.each(file.members, function(member) {
                            acknowledgeUsers.push({_id: member, isAcknow: false});
                        });
                        _.each(file.notMembers, function(member) {
                            acknowledgeUsers.push({email: member, isAcknow: false});
                        });
                        acknowledgeUsers.push({_id: file.owner, isAcknow: false});
                        _.remove(acknowledgeUsers, {_id: req.user._id});
                        cb();
                    } else if (file.element.type==="document") {
                        if (file.documentSet) {
                            Document.findById(file.documentSet, function(err, document) {
                                if (err || !document) {
                                    cb(err);
                                } else {
                                    _.each(document.members, function(member) {
                                        acknowledgeUsers.push({_id: member, isAcknow: false});
                                    });
                                    _.each(document.notMembers, function(email) {
                                        acknowledgeUsers.push({email: email, isAcknow: false});
                                    });
                                    cb();
                                }
                            });
                        } else {
                            cb();
                        }
                    } else {
                        cb();
                    }
                }
            ], function(err) {
                if (err) {return res.send(500,err);}
                var activityAndHisToryId = mongoose.Types.ObjectId();
                var history = {
                    link: data.url,
                    version: data.filename,
                    createdAt: new Date(),
                    activityAndHisToryId: activityAndHisToryId
                };  
                var activity = {
                    type: "upload-reversion",
                    user: req.user._id,
                    createdAt: new Date(),
                    acknowledgeUsers: acknowledgeUsers,
                    element: {
                        name: data.filename,
                    },
                    activityAndHisToryId: activityAndHisToryId
                };
                if (file.element.type==="document") {
                    activity.members = acknowledgeUsers;
                    history.members = acknowledgeUsers;
                    file.versionTags = data.versionTags.split();
                    history.versionTags = file.versionTags;
                    activity.element.versionTags = file.versionTags;
                } else {
                    file.description = data.description;
                }
                file.path = data.url;
                file.key = data.key;
                file.mimeType = data.mimeType;
                file.size = data.size;
                file.version = data.filename;
                file.fileHistory.push(history);
                file.activities.push(activity);
                file.markModified("uploadReversion");
                file._editUser = req.user;
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
                            event: file.element.type+':update',
                            room: file._id.toString(),
                            data: JSON.parse(JSON.stringify(file))
                        });

                        var randomId = mongoose.Types.ObjectId();
                        _.each(acknowledgeUsers, function(user) {
                            if ((file.element.type==="document" || file.element.type==="file") && user._id) {
                                EventBus.emit('socket:emit', {
                                    event: 'dashboard:new',
                                    room: user._id.toString(),
                                    data: {
                                        type: file.element.type,
                                        _id: file._id,
                                        uniqId: randomId,
                                        user: req.user,
                                        file: JSON.parse(JSON.stringify(file)),
                                        newNotification: {randomId: randomId, fromUser: req.user, type: file.element.type+"-upload-reversion"}
                                    }
                                });
                            }
                        });
                        return res.send(200, file);
                    });
                });
            });
        }
    });
};

/**
 * upload
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */
exports.upload = function(req, res){
    var data = req.body;

    if (data.belongToType) {
        var mainItem = getMainItem(data.belongToType);
    }
    var ownerItem;
    async.parallel([
        function (cb) {
            if (data.belongToType) {
                mainItem.findById(data.belongTo, function(err, main) {
                    if (err || !main) {cb(err);}
                    else {
                        ownerItem = main;
                        cb();
                    }
                });
            } else {
                cb();
            }
        }
    ], function(err) {
        if (err) {return res.send(500,err);}
        var file = new File({
            owner: req.user._id,
            project: req.params.id,
            name: data.file.filename,
            server: "s3",
            size: data.file.size,
            version: data.file.filename,
            mimeType: data.file.type,
            tag: (data.selectedTag) ? [data.selectedTag] : [],
            element: {type: data.type},
            key: data.file.key,
            path: data.file.url,
            activities: [{
                user: req.user._id,
                createdAt: new Date(),
                type: "upload-file",
                element: {name: data.file.filename}
            }]
        });
        if (ownerItem) {
            file.members = ownerItem.members;
            file.notMembers = ownerItem.notMembers;
            if (ownerItem.event) {
                file.event = ownerItem.event;
            }
        }
        file.save(function(err) {
            if (err) {
                return res.send(500,err);
            } else if (ownerItem) {
                ownerItem.activities.push({
                    user: req.user._id,
                    type: "related-file",
                    createdAt: new Date(),
                    element: {
                        item: file._id,
                        name: file.name,
                        related: true
                    }
                });
                var members = file.members;
                members.push(file.owner);
                ownerItem.relatedItem.push({
                    type: "file",
                    item: {_id: file._id},
                    members: members
                });
                ownerItem._editUser = req.user;
                ownerItem.save(function() {
                    EventBus.emit('socket:emit', {
                        event: 'relatedItem:new',
                        room: ownerItem._id.toString(),
                        data: {
                            type: file.element.type,
                            excuteUser: req.user,
                            belongTo: ownerItem._id,
                            data: JSON.parse(JSON.stringify(file)),
                        }
                    });
                    return res.send(200, file);
                });
            } else {
                return res.send(200,file);
            }
        });
    });


    
    // var form = new formidable.IncomingForm();
    // form.parse(req, function(err, fields, files) {
    //     if (err) {return res.send(500,err);}
    //     if (fields && files) {
    //         console.log(fields);
    //         console.log(files);
            
    //             s3.uploadFile(files.file, function(err, data) {
    //                 if (err) {return res.send(500,err);}
    //                 var path = s3.getPublicUrl(files.file.name);
    //                 var file = new File({
    //                     owner: req.user._id,
    //                     project: req.params.id,
    //                     name: files.file.name,
    //                     server: "s3",
    //                     size: files.file.size,
    //                     version: files.file.name,
    //                     mimeType: files.file.type,
    //                     tag: (fields.selectedTag) ? [fields.selectedTag] : [],
    //                     element: {type: fields.type},
    //                     key: files.file.name,
    //                     path: path,
    //                     activities: [{
    //                         user: req.user._id,
    //                         createdAt: new Date(),
    //                         type: "upload-file",
    //                         element: {name: files.file.name}
    //                     }]
    //                 });
    //                 if (ownerItem) {
    //                     file.members = ownerItem.members;
    //                     file.notMembers = ownerItem.notMembers;
    //                     if (ownerItem.event) {
    //                         file.event = ownerItem.event;
    //                     }
    //                 }
    //                 file.save(function(err) {
    //                     if (err) {
    //                         return res.send(500,err);
    //                     } else if (ownerItem) {
    //                         ownerItem.activities.push({
    //                             user: req.user._id,
    //                             type: "related-file",
    //                             createdAt: new Date(),
    //                             element: {
    //                                 item: file._id,
    //                                 name: file.name,
    //                                 related: true
    //                             }
    //                         });
    //                         var members = file.members;
    //                         members.push(file.owner);
    //                         ownerItem.relatedItem.push({
    //                             type: "file",
    //                             item: {_id: file._id},
    //                             members: members
    //                         });
    //                         ownerItem._editUser = req.user;
    //                         ownerItem.save(function() {
    //                             EventBus.emit('socket:emit', {
    //                                 event: 'relatedItem:new',
    //                                 room: ownerItem._id.toString(),
    //                                 data: {
    //                                     type: file.element.type,
    //                                     excuteUser: req.user,
    //                                     belongTo: ownerItem._id,
    //                                     data: JSON.parse(JSON.stringify(file)),
    //                                 }
    //                             });
    //                             return res.send(200, file);
    //                         });
    //                     } else {
    //                         return res.send(200,file);
    //                     }
    //                 });
    //             });
                
    //         });
    //     } else {
    //         return res.send(500,err);
    //     }
    // });
    // return;
    // // new version
    // if (data.type==="document" && !data.selectedDocumentSetId) {
    //     return res.send(422, {msg: "Please select a document set"});
    // }

    // // old version
    // /*if (data.type==="file" && !data.selectedEvent) {
    //     return res.send(422, {msg: "Selected Event Is Require"});
    // } else if (data.type==="document" && !data.selectedDocumentSetId) {
    //     return res.send(422, {msg: "Please select a document set"});
    // }*/
    // var filesAfterInsert = [];
    // var members = [];
    // var notMembers = [];
    // var acknowledgeUsers = [];
    // CheckMembers.check(data.members, null, function(result) {
    //     members = result.members;
    //     notMembers = result.notMembers;
    //     acknowledgeUsers = _.union(result.members, result.notMembers);

    //     var mainItem = getMainItem(data.belongToType);
    //     var file = new File({
    //         owner: req.user._id,
    //         project: req.params.id,
    //         description: data.description,
    //         members: members,
    //         notMembers: notMembers,
    //         element: {type: data.type}
    //     });
    //     if (data.type==="file") {
    //         file.name = "Untitled File";
    //     } else if (data.type==="document") {
    //         file.name = "Untitled Document";
    //     }
    //     if (data.file) {
    //         file.name = data.file.filename;
    //         file.path = data.file.url;
    //         file.key = data.file.key;
    //         file.mimeType = data.file.mimeType;
    //         file.size = data.file.size;
    //         file.version = data.file.filename;
    //         file.server = "s3";
    //         file.activities.push({
    //             user: req.user._id,
    //             createdAt: new Date(),
    //             type: "upload-file",
    //             element: {name: file.name}
    //         });
    //         file.members.push(req.user._id);
    //         file.event = data.selectedEvent;
    //     }
    //     var tags = [];
    //     _.each(data.tags, function(tag) {
    //         tags.push(tag.name);
    //     });
    //     file.tags = tags;   
    //     if (data.belongTo) {
    //         file.belongTo.item = {_id: data.belongTo};
    //         file.belongTo.type = data.belongToType;
    //     } else if (data.selectedDocumentSetId) {
    //         file.documentSet = data.selectedDocumentSetId;
    //     }
    //     file.save(function(err) {
    //         if (err) {return res.send(500,err);}
    //         async.parallel([
    //             function (cb) {
    //                 if (data.selectedEvent) {
    //                     Activity.findById(data.selectedEvent, function(err, activity) {
    //                         if (err || !activity) {
    //                             file.remove(function() {
    //                                 cb(err)   
    //                             });
    //                         } else {
    //                             activity.relatedItem.push({type: "file", item: {_id: file._id}});
    //                             activity.save(cb);
    //                         }
    //                     });
    //                 } else if (file.element.type==="document" && data.selectedDocumentSetId) {
    //                     Document.findById(data.selectedDocumentSetId, function(err, document) {
    //                         if (err || !document) {cb();}
    //                         else {
    //                             document.documents.push(file._id);
    //                             document.save(cb);
    //                         }
    //                     });
    //                 } else if (data.belongTo) {
    //                     mainItem.findById(req.body.belongTo, function(err, main) {
    //                         main.activities.push({
    //                             user: req.user._id,
    //                             type: "related-file",
    //                             createdAt: new Date(),
    //                             element: {
    //                                 item: file._id,
    //                                 name: file.name,
    //                                 related: true
    //                             }
    //                         });
    //                         members.push(req.user._id);
    //                         main.relatedItem.push({
    //                             type: "file",
    //                             item: {_id: file._id},
    //                             members: members
    //                         });
    //                         main._editUser = req.user;
    //                         main.save(cb);
    //                     });
    //                 } else {
    //                     cb();
    //                 }
    //             }
    //         ], function() {
    //             File.populate(file,[
    //                 {path: "project"}
    //             ], function(err, file) {
    //                 var randomId = mongoose.Types.ObjectId();
    //                 if (file.element.type==="file") {
    //                     _.each(acknowledgeUsers, function(user) {
    //                         if (file.element.type === "file" && user._id) {
    //                             EventBus.emit('socket:emit', {
    //                                 event: 'file:new',
    //                                 room: user._id.toString(),
    //                                 data: JSON.parse(JSON.stringify(file))
    //                             });
    //                             EventBus.emit('socket:emit', {
    //                                 event: 'dashboard:new',
    //                                 room: user._id.toString(),
    //                                 data: {
    //                                     type: file.element.type,
    //                                     _id: file._id,
    //                                     uniqId: randomId,
    //                                     user: req.user,
    //                                     file: JSON.parse(JSON.stringify(file)),
    //                                     newNotification: {fromUser: req.user, type: "file-assign"}
    //                                 }
    //                             });
    //                         }
    //                     });
    //                 }
    //                 return res.send(200, file);
    //             });
    //         });
    //     });
    // });
};