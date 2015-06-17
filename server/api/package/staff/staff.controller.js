'use strict';

var User = require('./../../../models/user.model');
var Project = require('./../../../models/project.model');
var StaffPackage = require('./../../../models/staffPackage.model');
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
    if (err) {
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
      return res.send(500, err);
    }
    var staffPackage = new StaffPackage(data);
    staffPackage.owner = user.team._id;
    staffPackage.project = project;
    staffPackage.staffs = [];
    _.forEach(req.body.staffs,function(item) {
      staffPackage.staffs.push(item._id._id);
    });
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
  StaffPackage.find({'project' : project._id},function(err,packages) {
    if (err) {
      return res.status(400).json(err);
    }
    return res.json(packages)
  })
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
    return res.json(staffPackage);
  });
};

exports.getDefaultPackagePackageByProject = function(req, res) {
  if (!req.query.project) {
    return res.status(400).json({msg: 'Missing project.'});
  }
  //TODO - validate user rol in the project

  BuilderPackage.findOne({
    project: req.query.project,
    isSendQuote: false
  })
    .populate('project')
    .exec(function(err, builderPackage) {
      if (err){ return res.send(500, err); }

      res.json(builderPackage);
    });
};

/**
 * get single package id
 */
exports.show = function(req, res){
  BuilderPackage.findById(req.params.id)
    .populate('project')
    .exec(function(err, builderPackage) {
      if (err){ return res.send(500, err); }

      res.json(builderPackage);
    });
};