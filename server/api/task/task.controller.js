'use strict';

var User = require('./../../models/user.model');
var Task = require('./../../models/task.model');
var StaffPackage = require('./../../models/staffPackage.model'),
    BuilderPackage = require('./../../models/builderPackage.model'),
    ContractorPackage = require('./../../models/contractorPackage.model'),
    MaterialPackage = require('./../../models/materialPackage.model'),
    Variation = require('./../../models/variation.model'),
    Notification = require('./../../models/notification.model'),
    Project = require('./../../models/project.model');
var TaskValidator = require('./../../validators/task');
var errorsHelper = require('../../components/helpers/errors');
var _ = require('lodash');
var async = require('async');

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
    if (err || !aPackage) {
      return res.send(500,err);
    }
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
  var project = req.project;
  var result = [];
  Task.find({$or : [{'user' : user._id}, {assignees : user._id}],project : project._id,completed : false})
    .sort('hasDateEnd')
    .sort({'dateEnd': 1})
    .populate('assignees')
    .populate('user')

    .exec(function(err,tasks) {
      if (err) {
        return res.send(500,err);
      }
      async.each(tasks,function(task,callback) {
        if (task.type == 'builder') {
          Task.populate(task,{path : 'package',model : 'BuilderPackage'},function(err,task) {
            Task.populate(task,[{path : 'package.owner',model : 'Team'},{path : 'package.to.team',model : 'Team'}],function(err,task) {
              Task.populate(task,[
                {path : 'package.owner.leader',model : 'User'},{path : 'package.owner.member._id',model : 'User'},
                {path : 'package.to.team.leader',model : 'User'},{path : 'package.to.team.member._id',model : 'User'}
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
                {path : 'package.owner.leader',model : 'User'},{path : 'package.owner.member._id',model : 'User'},
                {path : 'package.winnerTeam._id.leader',model : 'User'},{path : 'package.winnerTeam._id.member._id',model : 'User'}
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
                {path : 'package.owner.leader',model : 'User'},{path : 'package.owner.member._id',model : 'User'},
                {path : 'package.winnerTeam._id.leader',model : 'User'},{path : 'package.winnerTeam._id.member._id',model : 'User'}
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
                {path: 'package.owner.leader', model: 'User'}, {path: 'package.owner.member._id', model: 'User'},
                {path: 'package.winnerTeam._id.leader', model: 'User'}, {
                  path: 'package.winnerTeam._id.member._id',
                  model: 'User'
                }
              ], function (err, task) {
                result.push(task);
                callback(null)
              })
            })
          });
        } else if (task.type == 'staff') {
          Task.populate(task,{path : 'package',model : 'StaffPackage'},function(err,task) {
            User.populate(task,{path : 'package.staffs'},function(err,task) {
              result.push(task);
              callback(null)
            })
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
  var aPackage = req.aPackage;
  var user = req.user;
  TaskValidator.validateCreate(req,function(err,data) {
    if (err) {
      return errorsHelper.validationErrors(res,err)
    }
    var task = new Task(data);
    task.package = aPackage;
    task.project = aPackage.project;
    task.user = user;
    task.type = req.params.type;
    task.dateStart = new Date();
    task.save(function(err) {
      if (err) {
        return res.send(500,err)
      }
      return res.json(true);
    })
  })
};

exports.update = function(req,res) {
  var task = req.task;
  var user = req.user;
  TaskValidator.validateUpdate(req,function(err,data) {
    if (err) {
      return errorsHelper.validationErrors(res,err)
    }

    task = _.merge(task,data);
    task.assignees = data.assignees;
    task.markModified('assignees');
    task._editUser = req.user;
    task.save(function(err) {
      if (err) {
        return res.send(500,err)
      }
      return res.json(true);
    })
  })
};

exports.getTask = function(req,res) {
  var aPackage = req.aPackage;
  Task.find({package : aPackage})
    .sort('hasDateEnd')
    .sort({'dateEnd': -1})
    .populate('assignees')
    .exec(function(err,tasks) {
    if (err) {
      return res.send(500,err);
    }
    return res.json(tasks);
  });
};

exports.getAll = function(req, res) {
  Task.find({}, function(err, tasks){
    if (err) {return res.send(500,err);}
    return res.json(200, tasks);
  });
};

exports.getOne = function(req, res) {
  Task.findById(req.params.id).populate('assignees').exec(function(err, task){
    if (err) {return res.send(500,err);}
    if (!task) {return res.send(404);}
    return res.send(200,task);
  });
};
