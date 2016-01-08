'use strict';

var User = require('./../../models/user.model');
var Team = require('./../../models/team.model');
var Task = require('./../../models/task.model');
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
var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');

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
  Task.find({$or : [{'user' : user._id}, {assignees : user._id}],completed : false})
    .sort('hasDateEnd')
    .sort({'dateEnd': 1})
    .populate('assignees', '-hashedPassword -salt')
    .populate('user', '-hashedPassword -salt')
    .populate('project')

    .exec(function(err,tasks) {
      if (err) {
        return res.send(500,err);
      }
      async.each(tasks,function(task,callback) {
        if (task.type == 'builder') {
          Task.populate(task,{path : 'package',model : 'BuilderPackage'},function(err,task) {
            Task.populate(task,[{path : 'package.owner',model : 'Team'},{path : 'package.to.team',model : 'Team'}],function(err,task) {
              Task.populate(task,[
                {path : 'package.owner.leader',model : 'User', select: '-hashedPassword -salt'},{path : 'package.owner.member._id',model : 'User', select: '-hashedPassword -salt'},
                {path : 'package.to.team.leader',model : 'User', select: '-hashedPassword -salt'},{path : 'package.to.team.member._id',model : 'User', select: '-hashedPassword -salt'}
              ],function(err,task) {
                result.push(task);
                callback(null)
              })
            })
          });
        } else if (task.type == 'contractor') {
          Task.populate(task,{path : 'package',model : 'ContractorPackage'},function(err,task) {
            Task.populate(task,[{path : 'package.owner',model : 'Team'},{path : 'package.winnerTeam._id',model : 'Team'}],function(err,task) {
              Task.populate(task,[
                {path : 'package.owner.leader',model : 'User', select: '-hashedPassword -salt'},{path : 'package.owner.member._id',model : 'User', select: '-hashedPassword -salt'},
                {path : 'package.winnerTeam._id.leader',model : 'User', select: '-hashedPassword -salt'},{path : 'package.winnerTeam._id.member._id',model : 'User', select: '-hashedPassword -salt'}
              ],function(err,task) {
                result.push(task);
                callback(null)
              })
            })
          });
        } else if (task.type == 'material') {
          Task.populate(task,{path : 'package',model : 'MaterialPackage'},function(err,task) {
            Task.populate(task,[{path : 'package.owner',model : 'Team'},{path : 'package.winnerTeam._id',model : 'Team'}],function(err,task) {
              Task.populate(task,[
                {path : 'package.owner.leader',model : 'User', select: '-hashedPassword -salt'},{path : 'package.owner.member._id',model : 'User', select: '-hashedPassword -salt'},
                {path : 'package.winnerTeam._id.leader',model : 'User', select: '-hashedPassword -salt'},{path : 'package.winnerTeam._id.member._id',model : 'User', select: '-hashedPassword -salt'}
              ],function(err,task) {
                result.push(task);
                callback(null)
              })
            })
          });
        } else if (task.type == 'variation') {
          Task.populate(task, {path: 'package', model: 'Variation'}, function (err, task) {
            Task.populate(task, [{path: 'package.owner', model: 'Team'}, {
              path: 'package.winnerTeam._id',
              model: 'Team'
            }], function (err, task) {
              Task.populate(task, [
                {path: 'package.owner.leader', model: 'User', select: '-hashedPassword -salt'}, 
                {path: 'package.owner.member._id', model: 'User', select: '-hashedPassword -salt'},
                {path: 'package.winnerTeam._id.leader', model: 'User', select: '-hashedPassword -salt'}, 
                {path: 'package.winnerTeam._id.member._id', model: 'User', select: '-hashedPassword -salt'}
              ], function (err, task) {
                result.push(task);
                callback(null)
              })
            })
          });
        } else if (task.type == 'staff') {
          Task.populate(task,{path : 'package',model : 'StaffPackage'},function(err,task) {
            User.populate(task,{path : 'package.staffs', select: '-hashedPassword -salt'},function(err,task) {
              result.push(task);
              callback(null)
            })
          });
        } else if (task.type == "people") {
          Task.populate(task,{path : 'package',model : 'People'},function(err,task) {
            result.push(task);
            callback(null);
          });
        } else if (task.type == "board") {
          Task.populate(task,{path : 'package',model : 'Board'},function(err,task) {
            result.push(task);
            callback(null);
          });
        }
      },function(err) {
        if (err) {
          return res.send(500,err);
        }
        return res.json(result)
      });
    })
};

exports.create = function(req,res) {
    console.log(req.body);
    // var aPackage = req.aPackage;
    var user = req.user;
    TaskValidator.validateCreate(req,function(err,data) {
        if (err) {
          return errorsHelper.validationErrors(res,err)
        }
        var task = new Task(data);
        task.description = req.body.description;
        task.package = aPackage;
        task.project = aPackage.project;
        task.user = user;
        task.type = req.params.type;
        task.dateStart = new Date();
        task.peopleChat = req.body.peopleChat;
        var architectTeamLeader = [];
        if (aPackage.type == 'BuilderPackage' && aPackage.hasArchitectManager && aPackage.architect.team) {
          Team.findById(mongoose.Types.ObjectId(aPackage.architect.team), function(err, team){
            if (err) {return res.send(500,err);}
            _.each(team.leader, function(leader){
              architectTeamLeader.push(leader);
            });
            task.assignees = _.union(task.assignees, architectTeamLeader);
            task.save(function(err) {
              if (err) {
                return res.send(500,err)
              }
              Task.populate(task, {path:'assignees', select: '-hashedPassword -salt'}, function(err, task){
                if (err) {return res.send(500,err);}
                return res.json(task);
              });
            });
          });
        } else {
          task.assignees = _.union(task.assignees, architectTeamLeader);
          task._editUser = req.user;
          task.save(function(err) {
            if (err) {
              console.log(err);
              return res.send(500,err)
            }
            Task.populate(task, {path:'assignees', select: '-hashedPassword -salt'}, function(err, task){
              if (err) {console.log(err);return res.send(500,err);}
              return res.json(task);
            });
          });
        }
    });
};

exports.update = function(req,res) {
  var task = req.task;
  var user = req.user;
  TaskValidator.validateUpdate(req,function(err,data) {
    if (err) {
      return errorsHelper.validationErrors(res,err)
    }
console.log(req.body);
    task = _.merge(task,data);
    task.description = req.body.description;
    task.dateEnd = req.body.dateEnd;
    task.assignees = data.assignees;
    task.markModified('assignees');
    task._editUser = req.user;
    task.save(function(err) {
      if (err) {
        return res.send(500,err)
      }
      Task.populate(task, {path:'assignees', select: '-hashedPassword -salt'}, function(err, task){
        if (err) {return res.send(500,err);}
        return res.json(task);
      });
    });
  });
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

exports.getOne = function(req, res) {
  Task.findById(req.params.id).populate('assignees', '-hashedPassword -salt').exec(function(err, task){
    if (err) {return res.send(500,err);}
    if (!task) {return res.send(404);}
    return res.send(200,task);
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