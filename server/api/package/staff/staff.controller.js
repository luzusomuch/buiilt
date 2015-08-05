'use strict';

var User = require('./../../../models/user.model');
var Project = require('./../../../models/project.model');
var StaffPackage = require('./../../../models/staffPackage.model');
var Notification = require('./../../../models/notification.model');
var Validator = require('./../../../validators/staffPackage');
var errorsHelper = require('./../../../components/helpers/errors');
var _ = require('lodash');
var async = require('async');

/**
 * Get a single project
 * @param req
 * @param res
 * @param next
 */
exports.project = function(req,res,next) {
  Project.findById(req.params.id,function(err,project) {
    if (err || !project) {
      return res.send(500, err);
    }
    req.project = project;
    next();
  })
};

/**
 * Get a single staff package
 * @param req
 * @param res
 * @param next
 */
exports.staffPackage = function(req,res,next) {
  StaffPackage.findById(req.params.id,function(err,staffPackage) {
    if (err || !staffPackage) {
      return res.send(500, err);
    }
    req.staffPackage = staffPackage;
    next();
  })
}

/**
 * Create a new staff package
 * @param req
 * @param res
 */
exports.create = function(req,res) {
  var user = req.user;
  var project = req.project;
  Validator.validateCreate(req,function(err,data) {
    if (err) {
      return res.send(422, err);
    }
    var staffPackage = new StaffPackage(data);
    staffPackage.owner = user.team._id;
    staffPackage.project = project;
    staffPackage.type = 'staffPackage';
    staffPackage.staffs = data.staffs;
    staffPackage.markModified('staffs');
    staffPackage._editUser = user;
    staffPackage.save(function(err) {
      if (err) {
        return res.send(500, err);
      }
      return res.json(staffPackage)
    })
  });
};

/**
 * Get all staff pacakge
 * @param req
 * @param res
 */
exports.getAll = function(req,res) {
  var project = req.project;
  var user = req.user;
  StaffPackage.find({'project' : project._id},function(err,packages) {
    if (err) {
      return res.status(400).json(err);
    }
    async.each(packages,function(item,callback) {
      Notification.find({owner: user._id,'element.package' : item._id, unread : true}).count(function(err,count) {
        item.__v = count;
        callback();
      })
    },function() {
      return res.json(packages)
    });
  })
};

exports.getAllStaffPackage = function(req, res){
  StaffPackage.find({}, function(err, staffPackages){
    if (err) {return res.send(500,err);}
    return res.send(200,staffPackages);
  })
};

exports.destroy = function (req, res) {
  StaffPackage.findByIdAndRemove(req.params.id, function (err, staffPackage) {
    if (err) {
      return res.send(500, err);
    }
    console.log(staffPackage);
    StaffPackage.find({}, function(err,staffPackages){
      if (err) {return res.send(500,err);}
      return res.send(200, staffPackages);
    })
  });
};

/**
 * Get a staff package
 * @param req
 * @param res
 */
exports.getOne = function(req,res) {
  var staffPackage = req.staffPackage;
  StaffPackage.populate(staffPackage,
    [{path:"project"},
      {path:"owner"},
      {path:"staffs"}
    ], function(err, staffPakacge ) {
      if (err) {
        return res.status(400).json(err);
      }
      return res.json(staffPackage);
  });
};

exports.complete = function(req,res) {
  var staffPackage = req.staffPackage;
  staffPackage.isCompleted = !staffPackage.isCompleted;
  staffPackage.save(function(err) {
    if (err) {
      return res.status(400).json(err);
    }
    StaffPackage.populate(staffPackage,
      [{path:"project"},
        {path:"owner"},
        {path:"staffs"}
      ], function(err, staffPakacge ) {
        if (err) {
          return res.status(400).json(err);
        }
        return res.json(staffPackage);
      });
  })
};