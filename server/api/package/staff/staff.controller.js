'use strict';

var User = require('./../../../models/user.model');
var Project = require('./../../../models/project.model');
var StaffPackage = require('./../../../models/staffPackage.model');
var Validator = require('./../../../validators/staffPackage');
var errorsHelper = require('./../../../components/helpers/errors');
var _ = require('lodash');
var async = require('async');

exports.project = function(req,res,next) {
  Project.findById(req.params.id,function(err,project) {
    if (err) {
      return res.send(500, err);
    }
    req.project = project;
    next();
  })
};

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

exports.getList = function(req,res) {
  var project = req.project;
  StaffPackage.find({'project' : project._id},function(err,packages) {
    if (err) {
      return res.status(400).json(err);
    }
    return res.json(packages)
  })
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