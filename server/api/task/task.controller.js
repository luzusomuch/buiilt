'use strict';

var User = require('./../../models/user.model');
var Team = require('./../../models/team.model');
var Task = require('./../../models/task.model');
var Thread = require('./../../models/thread.model');
var StaffPackage = require('./../../models/staffPackage.model'),
    BuilderPackage = require('./../../models/builderPackage.model'),
    BuilderPackageNew = require('./../../models/builderPackageNew.model'),
    ContractorPackage = require('./../../models/contractorPackage.model'),
    MaterialPackage = require('./../../models/materialPackage.model'),
    Variation = require('./../../models/variation.model'),
    Notification = require('./../../models/notification.model'),
    Project = require('./../../models/project.model'),
    Design = require('./../../models/design.model'),
    Board = require('./../../models/board.model'),
    People = require('./../../models/people.model');
var TaskValidator = require('./../../validators/task');
var errorsHelper = require('../../components/helpers/errors');
var RelatedItem = require('../../components/helpers/related-item');
var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var EventBus = require('../../components/EventBus');

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
        EventBus.emit('socket:emit', {
            event: 'task:update',
            room: task._id.toString(),
            data: task
        });
        return res.send(200, task);
    });
};

function populateNewTask(task, res){
    Task.populate(task, [
        {path: "owner", select: "_id email name"},
        {path: "members", select: "_id email name"},
        {path: "activities.user", select: "_id email name"}
    ], function(err, task) {
        async.each(task.members, function(member, cb) {
            EventBus.emit('socket:emit', {
                event: 'task:new',
                room: member._id.toString(),
                data: task
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

exports.get = function(req, res) {
    Task.findById(req.params.id)
    .populate('members', '_id name email')
    .populate('owner', '_id name email')
    .populate('activities.user','_id name email')
    .exec(function(err, task){
        if (err) {return res.send(500,err);}
        if (!task) {return res.send(404);}
        RelatedItem.responseWithRelated("task", task, req.user, res);
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
                                populateNewTask(main, res);
                            } else if (req.body.belongToType === "file") {
                                populateFile(main, res);
                            }
                        });
                    }
                });
            } else {
                populateNewTask(task, res);
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
                }
                task.activities.push(activity);
                task._editUser = user;
                task.save(function(err) {
                    if (err) {
                        return res.send(500,err)
                    }
                    populateTask(task, res);
                });
            });
        }
    });
};

exports.getTasksByProject = function(req, res) {
    var user  = req.user;
    Task.find({project: req.params.id, $or:[{owner: user._id}, {members: user._id}]})
    .populate("owner", "_id name email")
    .populate("members", "_id name email")
    .exec(function(err, tasks) {
        if (err) {return res.send(500,err);}
        else {
            return res.send(200, tasks);
        }
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

exports.myTask = function(req,res) {
    var user = req.user;
    var result = [];
    Notification.find({owner: user._id, unread : true, referenceTo : 'task'})
    .populate("fromUser", "_id email name")
    .exec(function(err, notifications) {
        if (err) {return res.send(500,err);}
        async.each(notifications, function(notification, cb) {
            Task.findById(notification.element._id)
            .populate('members', '-hashedPassword -salt')
            .populate('owner', '-hashedPassword -salt')
            .populate('project')
            .exec(function(err, task) {
                if (err || !task) {
                    cb();
                } else {
                    task.element.fromUser = notification.fromUser;
                    task.element.notificationType = notification.type;
                    result.push(task);
                    cb();
                }
            })
        }, function() {
            return res.send(200, result);
        });
    });
    // Task.find({$or : [{'owner' : user._id}, {assignees : user._id}],completed : false})
    // .sort('hasDateEnd')
    // .sort({'dateEnd': 1})
    // .populate('assignees', '-hashedPassword -salt')
    // .populate('owner', '-hashedPassword -salt')
    // .populate('project')

    // .exec(function(err,tasks) {
    //     if (err) {
    //         return res.send(500,err);
    //     }
    //     async.each(tasks,function(task,callback) {
    //         if (task.element.type === "task-project") {
    //             result.push(task);
    //             callback(null);
    //         } else {
    //             callback(null);
    //         }
    //     },function(err) {
    //         if (err) {
    //             return res.send(500,err);
    //         }
    //         return res.json(result)
    //     });
    // })
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
    })
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