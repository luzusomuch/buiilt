'use strict';

var User = require('./../../models/user.model');
var Team = require('./../../models/team.model');
var Thread = require('./../../models/thread.model');
var Activity = require('./../../models/activity.model');
var Task = require('./../../models/task.model');
var File = require('./../../models/file.model');
var Notification = require('./../../models/notification.model');
var ThreadValidator = require('./../../validators/thread');
var errorsHelper = require('../../components/helpers/errors');
var RelatedItem = require('../../components/helpers/related-item');
var _ = require('lodash');
var async = require('async');
var EventBus = require('../../components/EventBus');
var mongoose = require("mongoose");
var CheckMembers = require("./../../components/helpers/checkMembers");

function populateNewThread(thread, res, req){
    Thread.populate(thread, [
        {path: "owner", select: "_id email name phoneNumber"},
        {path: "messages.user", select: "_id email name phoneNumber"},
        {path: "messages.mentions", select: "_id email name phoneNumber"},
        {path: "members", select: "_id email name phoneNumber"},
        {path: "activities.user", select: "_id email name phoneNumber"},
        {path: "project"}
    ], function(err, thread) {
        var uniqId = mongoose.Types.ObjectId();
        var members = _.clone(thread.members);
        _.remove(members, {_id: req.user._id});
        async.each(thread.members, function(member, cb) {
            EventBus.emit('socket:emit', {
                event: 'thread:new',
                room: member._id.toString(),
                data: thread
            });
            // EventBus.emit('socket:emit', {
            //     event: 'dashboard:new',
            //     room: member._id.toString(),
            //     data: {
            //         type: "thread",
            //         _id: thread._id,
            //         thread: thread,
            //         user: req.user,
            //         uniqId: uniqId,
            //         newNotification: {fromUser: req.user, type: "thread-assign"}
            //     }
            // });
            cb();
        }, function(){
            return res.send(200, thread);
        });
    });
};

function populateThread(thread, res, req){
    Thread.populate(thread, [
        {path: "owner", select: "_id email name phoneNumber"},
        {path: "messages.user", select: "_id email name phoneNumber"},
        {path: "messages.mentions", select: "_id email name phoneNumber"},
        {path: "members", select: "_id email name phoneNumber"},
        {path: "activities.user", select: "_id email name phoneNumber"}
    ], function(err, thread) {
        // get uniq available user may receive socket
        var members = _.clone(thread.members);
        members.push(thread.owner);
        if (req.user) {
            _.remove(members, {_id: req.user._id});
        }
        members = _.map(_.groupBy(members,function(doc){
            return doc._id;
        }),function(grouped){
            return grouped[0];
        });

        // Response socket to the available user
        if (req.editType && req.editType==="assign") {
            Thread.populate(thread, [{path: "project"}], function(err, newThread) {
                _.each(members, function(member) {
                    EventBus.emit('socket:emit', {
                        event: 'thread:new',
                        room: member._id.toString(),
                        data: newThread
                    });
                });
            });
        }

        if (thread.isArchive) {
            _.each(members, function(m) {
                EventBus.emit('socket:emit', {
                    event: 'thread:archive',
                    room: m._id.toString(),
                    data: thread
                });
            });
        } else {
            EventBus.emit('socket:emit', {
                event: 'thread:update',
                room: thread._id.toString(),
                data: thread
            });
        }
        return res.send(200, thread);
    });
};

/*
    Update last access of current user for thread to show it first
*/
exports.lastAccess = function(req, res) {
    Thread.findById(req.params.id, function(err, thread) {
        if (err) {return res.send(500,err);}
        if (!thread) {
            return res.send(404);
        }
        if (thread.lastAccess && thread.lastAccess.length > 0) {
            var index = _.findIndex(thread.lastAccess, function(access) {
                return access.user.toString()===req.user._id.toString();
            });
            if (index !== -1) {
                thread.lastAccess[index].time = new Date();
            } else {
                thread.lastAccess.push({user: req.user._id, time: new Date()});
            }
        } else {
            thread.lastAccess = [{user: req.user._id, time: new Date()}];
        }
        thread.save(function(err) {
            if (err) {return res.send(500,err);}
            return res.send(200);
        });
    });
};

/*
    Get related item of task when create it which related item
*/
var getMainItem = function(type) {
    var _item = {};
    switch (type) {
        case 'thread' :
            _item = Thread;
            break;
        case 'task' :
            _item = Task;
            break;
        case "file":
            _item = File
            break;
        default :
            break;
    }
    return _item;
};

/*
    Create new Thread
*/
exports.create = function(req,res) {
    var user = req.user;
    // This is the newest version - create new thread without enter information
    var thread = new Thread({
        name: (req.body.name) ? req.body.name : "Untitled Thread",
        project: req.params.id,
        owner: user._id,
        element: {type: req.body.type},
        event: (req.body.selectedEvent) ? req.body.selectedEvent : null
    });
    CheckMembers.check(req.body.members, null, function(result) {
        thread.members = result.members;
        thread.notMembers = result.notMembers;
        thread._editUser = user;
        // console.log(req.body);
        if (req.body.belongTo) {
            thread.belongTo.item = {_id: req.body.belongTo};
            thread.belongTo.type = req.body.belongToType;
        }
        if (req.body.message) {
            var message = {
                text : req.body.message,
                user : user,
                sendAt: new Date()
            };
            thread.activities.push({
                user: req.user._id,
                type: 'chat',
                createdAt: new Date(),
                element: {
                    message: req.body.message
                }
            });
            thread.messages.push(message);
        }
        var mainItem = getMainItem(req.body.belongToType);
        thread.save(function(err) {
            if (err) {return res.send(500,err);}
            if (req.body.belongTo) {
                mainItem.findById(req.body.belongTo, function(err, main) {
                    if (err || !main) {
                        thread.remove(function(err) {
                            return res.send(500, err);
                        });
                    } else {
                        main.activities.push({
                            user: req.user._id,
                            type: "related-thread",
                            createdAt: new Date(),
                            element: {
                                item: thread._id,
                                name: thread.name,
                                related: true
                            }
                        });
                        result.members.push(req.user._id);
                        main.relatedItem.push({
                            type: "thread",
                            item: {_id: thread._id},
                            members: result.members
                        });
                        main._editUser = req.user;
                        if (req.body.belongToType==="file") {
                            main._editType="create-related-item";
                        }
                        main.save(function(err) {
                            if (err) {return res.send(500,err);}
                            EventBus.emit('socket:emit', {
                                event: 'relatedItem:new',
                                room: main._id.toString(),
                                data: {
                                    type: "thread",
                                    excuteUser: req.user,
                                    belongTo: main._id,
                                    data: thread,
                                }
                            });

                            // Update count number of parent item
                            var owners = _.clone(main.members);
                            owners.push(main.owner);
                            _.remove(owners, req.user._id);
                            owners = _.map(_.groupBy(owners,function(doc){
                                return doc;
                            }),function(grouped){
                                return grouped[0];
                            });
                            _.each(owners, function(user) {
                                EventBus.emit('socket:emit', {
                                    event: 'dashboard:new',
                                    room: user.toString(),
                                    data: {
                                        type: "related-item",
                                        excuteUser: req.user,
                                        belongTo: main._id
                                    }
                                });
                            });
                            populateNewThread(thread, res, req);                
                        });
                    }
                });
            } else {
                populateNewThread(thread, res, req);
            }
        });
    });
};

// Update thread
exports.update = function(req,res) {
    var user = req.user;
    Thread.findById(req.params.id, function(err, thread) {
        if (err) {return res.send(500,err);}
        else if (!thread) {return res.send(404, "The specific message is not existed");}
        else if (req.body.elementType !== "unarchive" && thread.isArchive) {return res.send(500, {message: "This thread is archived"});}
        else {
            req.thread = thread;
            ThreadValidator.validateUpdate(req,function(err,data) {
                if (err) {
                    return errorsHelper.validationErrors(res,err)
                } else {
                    var editType;
                    thread = _.merge(thread,data);
                    var activity = {
                        user: req.user._id,
                        type: req.body.elementType,
                        createdAt: new Date(),
                        element: {}
                    };
                    if (req.body.elementType==="assign") {
                        editType = "assign";
                        var invitees = [];
                        _.each(req.body.newMembers, function(member) {
                            if (member.name) {
                                invitees.push(member.name);
                            } else {
                                invitees.push(member.email);
                            }
                        });
                        activity.element.invitees = invitees;
                        thread.members = data.members;
                        thread.notMembers = data.notMembers;
                    } else if (req.body.elementType==="add-event" || req.body.elementType==="change-event") {
                        thread.event = req.body.selectedEvent;
                    } else if (req.body.elementType==="edit-thread") {
                        thread.name = req.body.name;
                        activity.element.name = req.body.name;
                        if (req.body.newMembers && req.body.newMembers.length > 0) {
                            thread.members = data.members;
                            thread.notMembers = data.notMembers;
                            editType = "assign";
                            var invitees = [];
                            _.each(req.body.newMembers, function(member){
                                if (member.name) {
                                    invitees.push(member.name);
                                } else {
                                    invitees.push(member.email);
                                }
                            });
                            thread.activities.push({
                                user: req.user._id,
                                type: "assign",
                                createdAt: new Date(),
                                element: {
                                    invitees: invitees
                                }
                            });
                        }
                    } else {
                        thread.isArchive = req.body.isArchive;
                    }
                    
                    thread.activities.push(activity);
                    thread.markModified(req.body.elementType);
                    thread._editUser = req.user;
                    thread.save(function(err) {
                        if (err) {
                            return res.send(500,err)
                        }
                        req.editType = editType;
                        populateThread(thread, res, req);
                    });
                }
            });
        }
    });
};

// Send reply in thread
exports.sendMessage = function(req,res) {
    var user = req.user;
    Thread.findById(req.params.id, function(err, thread) {
        if (err) {return res.send(500,err);}
        else if (!thread) {return res.send(404, "The specific thread is not existed");}
        else {
            ThreadValidator.validateMessage(req,function(err,data) {
                var message = {
                    text : data.text,
                    user : user,
                    sendAt: new Date()
                };
                thread.activities.push({
                    user: req.user._id,
                    type: 'chat',
                    createdAt: new Date(),
                    element: {
                        message: data.text
                    }
                });
                thread.messages.push(message);
                thread._evtName = 'Thread.NewMessage';
                thread._message = message;
                thread.messageType = "sendMessage";
                thread.save(function(err) {
                    if (err) {
                        return res.send(422,err);
                    } else {
                        Thread.populate(thread, [
                            {path: "project"},
                            {path: "members", select: "_id name email"},
                            {path: "owner", select: "_id name email"}
                        ], function(err, thread) {
                            if (err) {return res.send(500,err);}
                            var owners = thread.members;
                            owners.push(thread.owner);
                            _.remove(owners, {_id: req.user._id});
                            var uniqId = mongoose.Types.ObjectId();
                            _.each(owners, function(user) {
                                EventBus.emit('socket:emit', {
                                    event: 'dashboard:new',
                                    room: user._id.toString(),
                                    data: {
                                        type: "thread",
                                        _id: thread._id,
                                        thread: thread,
                                        uniqId: uniqId,
                                        user: req.user,
                                        newNotification: {fromUser: req.user, message: data.text, type: "thread-message"}
                                    }
                                });
                            });
                            populateThread(thread, res, req);
                        });
                    }
                });
            });
        }
    });
};

/*
    Get threads list by project
*/
exports.getProjectThread = function(req, res) {
    var userId = (req.query.userId && req.user.role==="admin") ? req.query.userId : req.user._id;
    Thread.find({project: req.params.id, $or:[{owner: userId}, {members: userId}]})
    .populate('members', '_id name email')
    .populate('owner', '_id name email')
    .populate('messages.user', '_id name email')
    .exec(function(err, threads) {
        async.each(threads, function(thread, cb) {
            Notification.find({owner: userId, unread: true, "element._id": thread._id, $or: [{type: "thread-message"}, {type: "related-item"}]})
            .populate("fromUser", "_id name email").exec(function(err, notifications) {
                if (err) {cb(err);}
                else {
                    if (notifications.length > 0) {
                        var latestNotification = _.last(notifications);
                        thread.element.notificationType = latestNotification.type;
                        thread.element.notificationBy = latestNotification.fromUser;
                        thread.element.text = (latestNotification.element.messages.length > 0) ? _.last(latestNotification.element.messages).text : null;
                    }
                    thread.__v = notifications.length;
                    cb();
                }
            });
        }, function(err) {
            if (err) {return res.send(500,err);}
            return res.send(200, threads);
        });
    });
};

/*
    Get thread by id
*/
exports.getById = function(req, res){
    Thread.findById(req.params.id)
    .populate('messages.user','_id name email phoneNumber')
    .populate('messages.mentions','_id name email phoneNumber')
    .populate('members','_id name email phoneNumber')
    .populate('owner','_id name email phoneNumber')
    .populate('activities.user','_id name email phoneNumber')
    .exec(function(err, thread){
        if (err) {return res.send(500,err);}
        else if (!thread) {return res.send(404);}
        else {
            Notification.find({owner: req.user._id, unread: true, "element._id": thread._id, $or: [{type: "thread-message"}, {type: "related-item"}]}, function(err, notifications) {
                if (err) {return res.send(500,err);}
                thread.__v = notifications.length;
                RelatedItem.responseWithRelated("thread", thread, req.user, res);
            });
        }
    });
};

/*
    Get threads list which unread notification for showing in dashboard
*/
exports.myThread = function(req,res) {
    var user = req.user;
    var notifications = [];
    var threads = [];
    var query = Notification.find(
        {owner : user._id,unread : true, referenceTo : 'thread', $or: [{type: "thread-message"}, {type: "related-item"}]}
    );
    query.populate("fromUser", "_id email name").exec(function(err, notifications) {
        if (err) {return res.send(500,err);}
        notifications = notifications;
        async.each(notifications,function(notification,callback) {
            Thread.findById(notification.element._id)
            .populate('messages.user','-hashedPassword -salt')
            .populate('members','-hashedPassword -salt')
            .populate("project")
            .exec(function(err,thread) {
                if (err || !thread) {return callback(err);}
                else {
                    threads.push(thread);
                    callback();
                }
            });
        },function(err) {
            if (err) {return res.send(500,err);}
            var uniqueThreadsList = _.map(_.groupBy(threads,function(doc){
                return doc._id;
            }),function(grouped){
              return grouped[0];
            });
            _.each(uniqueThreadsList, function(thread) {
                thread.element.notifications = [];
                thread.element.limitNotifications = [];
                var index = 1;
                _.each(notifications, function(notification) {
                    if (notification.element._id.toString()===thread._id.toString()) {
                        var message;
                        if (notification.type==="thread-message") {
                            message = _.last(notification.element.messages).text;
                        }
                        thread.element.notifications.push({
                            fromUser: notification.fromUser,
                            type: notification.type,
                            message: message
                        });
                        if (index === 1) {
                           thread.element.limitNotifications.push({
                                fromUser: notification.fromUser,
                                type: notification.type,
                                message: message
                            }); 
                        }
                        index+=1;
                    }
                });
            });
            return res.send(200, uniqueThreadsList);
        });
    });
};

/*
    Delete thread
    Require admin role
*/
exports.destroy = function (req, res) {
    var allow = false;
    Thread.findById(req.params.id, function(err, thread) {
        if (err) {return res.send(500,err);}
        else if (!thread) {return res.send(404);}
        else if (req.user.role==="admin") {
            allow = true;
        } else if (req.user._id.toString()===thread.owner.toString()) {
            allow = true;
        }

        if (allow) {
            thread.remove(function(err) {
                if (err) {return res.send(500,err);}
                return res.send(200, []);
            });
        } else {
            return res.send(500, {msg: "Not Allowed"});
        }
    });
    // Thread.findByIdAndRemove(req.params.id, function (err, thread) {
    //     if (err) {
    //         return res.send(500, err);
    //     }
    //     Thread.find({}, function(err,threads){
    //         if (err) {return res.send(500,err);}
    //         return res.send(200, threads);
    //     });
    // });
};

/*
    This code is old version, use to reply a thread via email 
*/
exports.replyMessage = function(req, res) {
    var splited = req.body.recipient.split("@");
    Thread.findById(splited[0], function(err, thread) {
        if (err) {
            return res.send(500,err);
        }
        else if (!thread) {return res.send(404, {message: "The specific thread is not existed"});}
        else {
            var message = {
                text: req.body["stripped-text"],
                mentions: [],
                sendAt: new Date()
            };
            var activity = {
                type: 'chat',
                createdAt: new Date(),
                element: {
                    message: req.body["stripped-text"]
                }
            }
            User.findOne({email: req.body.sender}, function(err, user) {
                if (err) {
                    return res.send(500,err);
                }
                else if (!user) {
                    message.email = req.body.sender;
                    activity.email = req.body.sender;
                } else {
                    message.user = user._id;
                    activity.user = user._id;
                }
                thread.messages.push(message);
                thread.activities.push(activity);
                thread._editUser = user;
                thread.save(function(err) {
                    if (err) {
                        return res.send(500,err);
                    }
                    Thread.populate(thread, [
                        {path: "project"},
                        {path: "members", select: "_id name email"},
                        {path: "owner", select: "_id name email"}
                    ], function(err, thread) {
                        if (err) {
                            return res.send(500,err);
                        }
                        var owners = thread.members;
                        owners.push(thread.owner);
                        var uniqId = mongoose.Types.ObjectId();
                        _.each(owners, function(user) {
                            EventBus.emit('socket:emit', {
                                event: 'dashboard:new',
                                room: user._id.toString(),
                                data: {
                                    isReplyViaEmail: true,
                                    type: "thread",
                                    _id: thread._id,
                                    thread: thread,
                                    uniqId: uniqId,
                                    user: req.user,
                                    newNotification: {fromUser: req.user, message: req.body["stripped-text"], type: "thread-message"}
                                }
                            });
                        });
                        populateThread(thread, res, req);
                    });
                });
            });
        }
    });
};