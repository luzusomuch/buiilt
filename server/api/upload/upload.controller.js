'use strict';

var User = require('./../../models/user.model');
var People = require('./../../models/people.model');
var Team = require('./../../models/team.model');
var Project = require('./../../models/project.model');
var File = require('./../../models/file.model');
var Notification = require('./../../models/notification.model');
var NotificationHelper = require('./../../components/helpers/notification');
var errorsHelper = require('../../components/helpers/errors');
var formidable = require('formidable');
var mkdirp = require('mkdirp');
var path = require('path');
var s3 = require('../../components/S3');
var _ = require('lodash');
var async = require('async');
var gm = require('gm');
var fs = require('fs');
var exec = require('child_process').exec;
var config = require('./../../config/environment');
var RelatedItem = require('../../components/helpers/related-item');
var EventBus = require('../../components/EventBus');
var mongoose = require("mongoose");

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

var validationError = function (res, err) {
    return res.json(422, err);
};

exports.uploadMobile = function(req, res) {
    var filesAfterInsert = [];
    var item = req.body;
    var file = new File({
        name: item.filename,
        path: item.url,
        key: item.key,
        server: 's3',
        mimeType: item.mimeType,
        description: item.desc,
        size: item.size,
        user: req.user._id,
        belongTo: req.params.id,
        belongToType: item.belongToType,
        peopleChat: item.peopleChat,
        tags: item.tags
    });
    file.save(function(err) {
        if (err) {return res.send(500,err);}
        else {
            return res.send(200,file);
        }
    });
};

exports.uploadReversion = function(req, res) {
    var newFile = req.body.files[0];
    console.log(req.body);
    File.findById(req.params.id, function(err, file) {
        if (err) {return res.send(500,err);}
        else if (!file) {return res.send(404, "The specific file is not existed");}
        else {
            var acknowledgeUsers = [];
            async.parallel([
                function(cb) {
                    if (file.element.type === "file" || file.element.type === "tender") {
                        _.each(file.members, function(member) {
                            acknowledgeUsers.push({_id: member, isAcknow: false});
                        });
                        _.each(file.notMembers, function(member) {
                            acknowledgeUsers.push({email: member, isAcknow: false});
                        });
                        acknowledgeUsers.push({_id: file.owner, isAcknow: false});
                        _.remove(acknowledgeUsers, {_id: req.user._id});
                        cb();
                    } else {
                        People.findOne({project: file.project}, function(err, people) {
                            if (err || !people) {cb();}
                            else {
                                var roles = ["builders", "clients", "architects", "subcontractors", "consultants"];
                                _.each(roles, function(role) {
                                    _.each(people[role], function(tender) {
                                        if (tender.hasSelect && tender.tenderers[0]._id) {
                                            if (_.findIndex(req.body.teamMembers, function(member) {
                                                if (member._id) {
                                                    return member._id.toString()===tender.tenderers[0]._id.toString();
                                                }
                                            }) !== -1) {
                                                acknowledgeUsers.push({_id: tender.tenderers[0]._id, isAcknow: false});
                                                if (tender.tenderers[0].teamMember.length > 0) {
                                                    _.each(tender.tenderers[0].teamMember, function(member) {
                                                        acknowledgeUsers.push({_id: member, isAcknow: false});
                                                    });
                                                }
                                            } else {
                                                _.each(tender.tenderers[0].teamMember, function(member) {
                                                    if (_.findIndex(req.body.teamMembers, function(item) {
                                                        if (item._id) 
                                                            return item._id.toString()===member.toString();
                                                    }) !== -1) {
                                                        acknowledgeUsers.push({_id: member, isAcknow: false});
                                                    }
                                                });
                                            }
                                        } else if (tender.hasSelect && tender.tenderers[0].email) {
                                            if (_.findIndex(req.body.teamMembers, function(member) {
                                                if (member.email) {
                                                    return member.email.toString()===tender.tenderers[0].email.toString();
                                                }
                                            }) !== -1) {
                                                acknowledgeUsers.push({email: tender.tenderers[0].email, isAcknow: false});
                                            }
                                        }
                                    });
                                });
                                cb();
                            }
                        });
                    }
                }
            ], function(err) {
                if (err) {return res.send(500,err);}
                var activityAndHisToryId = mongoose.Types.ObjectId();
                var history = {
                    description: file.description,
                    link: newFile.url,
                    version: newFile.filename,
                    createdAt: new Date(),
                    activityAndHisToryId: activityAndHisToryId
                };  
                var activity = {
                    type: "upload-reversion",
                    user: req.user._id,
                    createdAt: new Date(),
                    acknowledgeUsers: acknowledgeUsers,
                    element: {
                        name: newFile.filename,
                        description: req.body.description,
                    },
                    activityAndHisToryId: activityAndHisToryId
                };
                if (file.element.type==="document") {
                    activity.members = acknowledgeUsers;
                    history.members = acknowledgeUsers;
                    var versionTags = [];
                    _.each(req.body.versionTags, function(tag) {
                        versionTags.push(tag.tag);
                    });
                    file.versionTags = versionTags;
                    history.versionTags = versionTags;
                    activity.element.versionTags = versionTags;
                } else {
                    file.description = req.body.description;
                }
                file.path = newFile.url;
                file.key = newFile.key;
                file.mimeType = newFile.mimeType;
                file.size = newFile.size;
                file.version = newFile.filename;
                file.fileHistory.push(history);
                file.activities.push(activity);
                file._editType = "uploadReversion";
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
                        var randomId = mongoose.Types.ObjectId();
                        _.each(acknowledgeUsers, function(user) {
                            if (file.element.type === "file" && user._id) {
                                EventBus.emit('socket:emit', {
                                    event: 'dashboard:new',
                                    room: user._id.toString(),
                                    data: {
                                        type: "file",
                                        _id: file._id,
                                        file: JSON.parse(JSON.stringify(file)),
                                        newNotification: {randomId: randomId, fromUser: req.user, type: "file-upload-reversion"}
                                    }
                                });
                            } else if (file.element.type === "document" && user._id) {
                                EventBus.emit('socket:emit', {
                                    event: 'dashboard:new',
                                    room: user._id.toString(),
                                    data: {
                                        type: "file",
                                        _id: file._id,
                                        file: JSON.parse(JSON.stringify(file)),
                                        newNotification: {randomId: randomId, fromUser: req.user, type: "document-upload-reversion"}
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
    console.log(data);
    var filesAfterInsert = [];
    var members = [];
    var notMembers = [];
    var acknowledgeUsers = [];
    async.parallel([
        function(callback) {
            if (data.members && data.members.length > 0) {
                async.each(data.members, function(member, cb) {
                    User.findOne({email: member.email}, function(err, user) {
                        if (err) {console.log(err);cb(err);}
                        else if (!user) {
                            acknowledgeUsers.push({email: member.email, isAcknow: false});
                            notMembers.push(member.email);
                            cb();
                        }
                        else {
                            acknowledgeUsers.push({_id: user._id, isAcknow: false});
                            members.push(user._id);
                            cb();
                        }
                    });
                }, callback);
            } else {
                // var roles = ["builders", "clients", "architects", "subcontractors", "consultants"];
                // People.findOne({project: req.params.id}, function(err, people) {
                //     if (err || !people) {callback();}
                //     else {
                //         _.each(roles, function(role) {
                //             _.each(people[role], function(tender){
                //                 if (tender.hasSelect && tender.tenderers[0]._id) {
                //                     acknowledgeUsers.push({_id: tender.tenderers[0]._id});
                //                     if (tender.tenderers[0]._id.toString()===req.user._id.toString()) {
                //                         _.each(tender.tenderers[0].teamMember, function(member) {
                //                             acknowledgeUsers.push({_id: member});
                //                         });
                //                     }
                //                 } else if (tender.hasSelect && tender.tenderers[0].email) {
                //                     acknowledgeUsers.push({email: tender.tenderers[0].email});
                //                 }
                //             });
                //         });
                //         _.remove(acknowledgeUsers, {_id: req.user._id});
                //         callback();
                //     }
                // });
                callback();
            }
        }
    ], function(err, result) {
        if (err) {return res.send(500,err);}
        var mainItem = getMainItem(data.belongToType);
        var file = new File({
            owner: req.user._id,
            project: req.params.id,
            name: data.name,
            description: data.description,
            members: members,
            notMembers: notMembers,
            element: {type: data.type}
        });
        if (data.file) {
            file.name = data.file.filename;
            file.path = data.file.url;
            file.key = data.file.key;
            file.mimeType = data.file.mimeType;
            file.size = data.file.size;
            file.version = data.file.filename;
            file.server = "s3";
            file.activities.push({
                user: req.user._id,
                createdAt: new Date(),
                type: "upload-file",
                element: {name: file.name}
            });
        }
        var tags = [];
        _.each(data.tags, function(tag) {
            tags.push(tag.name);
        });
        file.tags = tags;   
        if (data.belongTo) {
            file.belongTo.item = {_id: data.belongTo};
            file.belongTo.type = data.belongToType;
        }
        file.save(function(err) {
            if (err) {return res.send(500,err);}
            if (data.belongTo) {
                mainItem.findById(req.body.belongTo, function(err, main) {
                    main.activities.push({
                        user: req.user._id,
                        type: "related-file",
                        createdAt: new Date(),
                        element: {
                            item: file._id,
                            name: file.name,
                            related: true
                        }
                    });
                    members.push(req.user._id);
                    main.relatedItem.push({
                        type: "file",
                        item: {_id: file._id},
                        members: members
                    });
                    main._editUser = req.user;
                    main.save(function(err) {
                        if (err) {return res.send(500,err);}
                        populateFile(file, res);
                    });
                });
            } else {
                File.populate(file,[
                    {path: "project"}
                ], function(err, file) {
                    var randomId = mongoose.Types.ObjectId();
                    _.each(acknowledgeUsers, function(user) {
                        if (file.element.type === "file" && user._id) {
                            EventBus.emit('socket:emit', {
                                event: 'file:new',
                                room: user._id.toString(),
                                data: JSON.parse(JSON.stringify(file))
                            });
                            EventBus.emit('socket:emit', {
                                event: 'dashboard:new',
                                room: user._id.toString(),
                                data: {
                                    type: "file",
                                    _id: file._id,
                                    file: JSON.parse(JSON.stringify(file)),
                                    newNotification: {randomId: randomId, fromUser: req.user, type: "file-assign"}
                                }
                            });
                        } else if (file.element.type === "document" && user._id) {
                            EventBus.emit('socket:emit', {
                                event: 'document:new',
                                room: user._id.toString(),
                                data: JSON.parse(JSON.stringify(file))
                            });
                            EventBus.emit('socket:emit', {
                                event: 'dashboard:new',
                                room: user._id.toString(),
                                data: {
                                    type: "file",
                                    _id: file._id,
                                    file: JSON.parse(JSON.stringify(file)),
                                    newNotification: {randomId: randomId, fromUser: req.user, type: "document-assign"}
                                }
                            });
                        }
                    });
                    return res.send(200, file);
                });
            }
        });
    });
};