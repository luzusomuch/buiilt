'use strict';

var User = require('./../../models/user.model');
var Team = require('./../../models/team.model');
var Task = require('./../../models/task.model');
var Thread = require('./../../models/thread.model');
var Notification = require('./../../models/notification.model'),
    Project = require('./../../models/project.model'),
    People = require('./../../models/people.model');
var TaskValidator = require('./../../validators/task');
var errorsHelper = require('../../components/helpers/errors');
var RelatedItem = require('../../components/helpers/related-item');
var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var EventBus = require('../../components/EventBus');
var moment = require("moment");

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

function populateTask(task, res, req){
    Task.populate(task, [
        {path: "owner", select: "_id email name"},
        {path: "members", select: "_id email name"},
        {path: "activities.user", select: "_id email name"}
    ], function(err, task) {
        EventBus.emit('socket:emit', {
            event: 'task:update',
            room: task._id.toString(),
            data: task
        });
        var owners = _.clone(task.members);
        owners.push(task.owner);
        _.remove(owners, {_id: req.user._id});
        _.each(owners, function(owner) {
            EventBus.emit("socket:emit", {
                event: "dashboard:new",
                room: owner._id.toString(),
                data: {
                    type: "task",
                    _id: task._id,
                    task: task,
                    user: req.user,
                    newNotification: {fromUser: req.user, type: "task-update"}
                }
            });
        });
        return res.send(200, task);
    });
};

function populateNewTask(task, res, req){
    Task.populate(task, [
        {path: "owner", select: "_id email name"},
        {path: "members", select: "_id email name"},
        {path: "activities.user", select: "_id email name"},
        {path: "project"}
    ], function(err, task) {
        async.each(task.members, function(member, cb) {
            EventBus.emit('socket:emit', {
                event: 'task:new',
                room: member._id.toString(),
                data: task
            });
            EventBus.emit('socket:emit', {
                event: 'dashboard:new',
                room: member._id.toString(),
                data: {
                    type: "task",
                    _id: task._id,
                    task: task,
                    newNotification: {fromUser: req.user, type: "task-assign"}
                }
            });
            cb();
        }, function() {
            return res.send(200, task);
        });
    });
};

function populateFile(file, res){
    File.populate(file, [
        {path: "owner", select: "_id email name"},
        {path: "members", select: "_id email name"},
        {path: "activities.user", select: "_id email name"}
    ], function(err, file) {
        return res.send(200, file);
    });
};

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

exports.getAll = function(req, res) {
    Task.find({}).populate('assignees', '-hashedPassword -salt').exec(function(err, tasks){
        if (err) {return res.send(500,err);}
        return res.json(200, tasks);
    });
};

exports.destroy = function (req, res) {
    Task.findByIdAndRemove(req.params.id, function (err, task) {
        if (err) {
            return res.send(500, err);
        }
        Task.find({}, function(err,tasks){
            if (err) {return res.send(500,err);}
            return res.send(200, tasks);
        });
    });
};

exports.get = function(req, res) {
    Task.findById(req.params.id)
    .populate('members', '_id name email')
    .populate('owner', '_id name email')
    .populate('activities.user','_id name email')
    .populate("completedBy, '_id name email")
    .exec(function(err, task){
        if (err) {return res.send(500,err);}
        if (!task) {return res.send(404);}
        Notification.find({owner: req.user._id, unread: true, "element._id": task._id}, function(err, notifications) {
            if (err) {return res.send(500,err);}
            task.__v = notifications.length;
            if (req.query.isAdmin && req.user.role==="admin") {
                return res.send(200, task);
            }
            RelatedItem.responseWithRelated("task", task, req.user, res);
        });
    });
};

exports.create = function(req,res) {
    var user = req.user;
    TaskValidator.validateCreate(req,function(err,data) {
        if (err) {
          return errorsHelper.validationErrors(res,err)
        }
        var task = new Task(data);
        
        task.project = req.params.id;
        task.owner = user._id;
        task.dateStart = new Date();
        task.element = {type: req.body.type};
        if (req.body.dateEnd) {
            task.hasDateEnd = true;
            task.dateEnd = req.body.dateEnd;
        }
        task.activities.push({
            user: user._id,
            type: "create-task",
            createdAt: new Date(),
        });
        if (req.body.belongTo) {
            task.belongTo.item = {_id: req.body.belongTo};
            task.belongTo.type = req.body.belongToType;
        }
        task._editUser = user;
        var mainItem = getMainItem(req.body.belongToType);
        task.save(function(err) {
            if (err) {return res.send(500,err);}
            else if (req.body.belongTo) {
                mainItem.findById(req.body.belongTo, function(err, main) {
                    if (err || !main) {
                        task.remove(function() {
                            return res.send(500);
                        });
                    } else {
                        main.activities.push({
                            user: req.user._id,
                            type: "related-task",
                            createdAt: new Date(),
                            element: {
                                item: task._id,
                                name: task.description,
                                related: true
                            }
                        });
                        data.members.push(req.user._id);
                        main.relatedItem.push({
                            type: "task",
                            item: {_id: task._id},
                            members: data.members
                        });
                        main.save(function(err) {
                            if (err) {return res.send(500,err);}
                            if (req.body.belongToType === "thread") 
                                populateThread(main, res);
                            else if (req.body.belongToType === "task") {
                                populateNewTask(main, res, req);
                            } else if (req.body.belongToType === "file") {
                                populateFile(main, res);
                            }
                        });
                    }
                });
            } else {
                populateNewTask(task, res, req);
            }
        });
    });
};

exports.update = function(req,res) {
    var user = req.user;
    Task.findById(req.params.id, function(err, task) {
        if (err) {return res.send(500,err);}
        else if (!task) {return res.send(404, "This specific task not existed!");}
        else {
            var orginalTask = _.clone(task)._original;
            req.task = task;
            TaskValidator.validateUpdate(req,function(err,data) {
                if (err) {
                    return errorsHelper.validationErrors(res,err)
                }
                task = _.merge(task,data);
                task.members = data.members;
                task.notMembers = data.notMembers;
                var activity = {
                    user: user._id,
                    type: req.body.editType,
                    createdAt: new Date(),
                    element: {}
                };
                if (req.body.editType === "edit-task") {
                    task.description = data.description;
                    task.dateEnd = data.dateEnd;
                    activity.element.description = (orginalTask.description.length !== req.body.description.length) ? orginalTask.description : null;
                    activity.element.dateEnd = (orginalTask.dateEnd !== req.body.dateEnd) ? orginalTask.dateEnd : null;
                } else if (req.body.editType === "assign") {
                    if (orginalTask.members.length < data.members.length) {
                        var members = [];
                        _.each(req.body.newMembers, function(member) {
                            members.push(member.name);
                        });
                        activity.element.members = members;
                    }
                    task.markModified('assignees');
                } else if (req.body.editType === "complete-task") {
                    task.markModified('completed');
                } else if (req.body.editType==="insert-note") {
                    activity.element.content = req.body.note;
                    task.markModified("insertNote")
                }
                task.activities.push(activity);
                task._editUser = user;
                task.save(function(err) {
                    if (err) {
                        return res.send(500,err)
                    }
                    populateTask(task, res, req);
                });
            });
        }
    });
};

exports.getTasksByProject = function(req, res) {
    var userId  = (req.query.userId && req.user.role==="admin") ? req.query.userId : req.user._id;
    Task.find({project: req.params.id, $or:[{owner: userId}, {members: userId}]})
    .populate("owner", "_id name email")
    .populate("members", "_id name email")
    .populate("project")
    .exec(function(err, tasks) {
        async.each(tasks, function(task, cb) {
            Notification.find({unread: true, owner: userId, "element._id": task._id, referenceTo: "task"})
            .populate("fromUser", "_id name email").exec(function(err, notifications) {
                if (err) {cb(err);}
                else {
                    if (notifications.length > 0) {
                        var latestNotification = _.last(notifications);
                        task.element.notificationType = latestNotification.type;
                        task.element.notificationBy = latestNotification.fromUser;
                    }
                    task.__v = notifications.length;
                    cb();
                }
            });
        }, function(err) {
            if (err) {return res.send(500,err);}
            else {
                return res.send(200, tasks);
            }
        });
    });
};

exports.myTask = function(req,res) {
    var user = req.user;
    var tasksList = [];
    Task.find({completed: false, $or:[{owner: user._id}, {members: user._id}]})
    .populate('members', '-hashedPassword -salt')
    .populate('owner', '-hashedPassword -salt')
    .populate('project')
    .exec(function(err, tasks) {
        if (err) {return res.send(500,err);}
        tasksList = tasks;
        async.each(tasks, function(task, cb) {
            task.element.notifications = [];
            task.element.limitNotifications = [];
            Notification.find({owner: user._id, "element._id": task._id, unread: true})
            .populate("fromUser", "_id name email").exec(function(err, notifications) {
                if (err) {cb(err);}
                var index = 1;
                _.each(notifications, function(notification) {
                    if (notification.element._id.toString()===task._id.toString()) {
                        task.element.notifications.push({
                            fromUser: notification.fromUser,
                            type: notification.type
                        });
                        if (index === 1) {
                           task.element.limitNotifications.push({
                                fromUser: notification.fromUser,
                                type: notification.type
                            }); 
                        }
                        index+=1
                    }
                });
                cb();
            });
        }, function() {
            return res.send(200, tasks);
        });
    });
};

var getPackage = function(type) {
  var _package = {};
  switch (type) {
    case 'staff' :
      _package = StaffPackage;
      break;
    case 'builder' :
      _package = BuilderPackage;
      break;
    case 'contractor' :
      _package = ContractorPackage;
      break;
    case 'material' :
      _package = MaterialPackage;
      break;
    case 'variation' :
      _package = Variation;
      break;
    case 'design':
      _package = Design;
      break;
    case 'people':
      _package = People;
      break;
    case 'board':
      _package = Board;
      break;
    default :
      break;
  }
  return _package;
};

exports.project = function(req,res,next) {
  Project.findById(req.params.id,function(err,project) {
    if (err || !project) {
      return res.send(500,err);
    }
    req.project = project;
    next();
  })
};

exports.package = function(req,res,next) {
  var _package = getPackage(req.params.type);
  _package.findById(req.params.id,function(err,aPackage) {
    if (err) {
      return res.send(500,err);
    } 
    if (!aPackage) {return res.send(404);}
    req.aPackage = aPackage;
    next();
  })
};

exports.task = function(req,res,next) {
  Task.findById(req.params.id,function(err,task) {
    if (err || !task) {
      return res.send(500,err)
    }
    req.task = task;
    next();
  })
};







exports.getTask = function(req,res) {
  var aPackage = req.aPackage;
  var user = req.user;
  Task.find({$and:[{package : aPackage}, {$or:[{user: user._id},{assignees: user._id}]}]})
    .sort('hasDateEnd')
    .sort({'dateEnd': -1})
    .populate('assignees', '-hashedPassword -salt')
    .exec(function(err,tasks) {
    if (err) {
      return res.send(500,err);
    }
    return res.json(tasks);
  });
};

exports.getByPackage = function(req, res){
  Task.find({package: req.params.id, type: req.params.type})
  .populate('assignees', '-hashedPassword -salt').exec(function(err, tasks){
    if (err) {return res.send(500,err);}
    if (!tasks) {return res.send(404);}
    return res.send(200,tasks);
  });
};



exports.show = function(req, res) {
  var _package = getPackage(req.params.type);
  Task.findById(req.params.id)
  .populate('assignees', '-hashedPassword -salt')
  .populate('project').exec(function(err, task){
    if (err) {return res.send(500,err);}
    if (!task) {return res.send(404);}
    _package.findById(task.package, function(err, aPackage){
      if (err) {return res.send(500,err);}
      if (!aPackage) {return res.send(404);}
      return res.send(200, {task: task, aPackage: aPackage});
    });
  });
};

exports.getAllByUser = function(req, res) {
  Task.find({$or:[{user: req.user._id},{assignees: req.user._id}]})
  .populate('user')
  .populate('assignees').exec(function(err, tasks){
    if (err) {return res.send(500,err);}
    return res.send(200,tasks);
  });
};

exports.getAllByProject = function(req, res) {
  Task.find({project: req.params.id})
  .populate('user')
  .populate('assignees').exec(function(err, tasks){
    if (err) {return res.send(500,err);}
    return res.send(200,tasks);
  });
};