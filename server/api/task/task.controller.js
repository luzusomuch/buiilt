'use strict';

var User = require('./../../models/user.model');
var Task = require('./../../models/task.model');
var StaffPackage = require('./../../models/staffPackage.model'),
    BuilderPackage = require('./../../models/builderPackage.model'),
    ContractorPackage = require('./../../models/contractorPackage.model'),
    MaterialPackage = require('./../../models/materialPackage.model');
var errorsHelper = require('../../components/helpers/errors');
var TaskValidator = require('./../../validators/task');
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
    default :
      break;
  }
  return _package;
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

exports.create = function(req,res) {
  var aPackage = req.aPackage;
  var user = req.user;
  TaskValidator.validateCreate(req,function(err,data) {
    if (err) {
      return errorsHelper.validationErrors(res,err)
    }
    var task = new Task(data);
    task.package = aPackage;
    task.user = user;
    task.project = aPackage.project;
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
    .populate('assignees')
    .exec(function(err,tasks) {
    if (err) {
      return res.send(500,err);
    }
    return res.json(tasks);
  });
};
