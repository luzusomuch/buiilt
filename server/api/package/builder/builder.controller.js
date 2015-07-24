'use strict';

var User = require('./../../../models/user.model');
var Project = require('./../../../models/project.model');
var BuilderPackage = require('./../../../models/builderPackage.model');
var errorsHelper = require('./../../../components/helpers/errors');
var ProjectValidator = require('./../../../validators/project');
var _ = require('lodash');
var async = require('async');

exports.project = function(req, res, next) {
  Project.findById(req.params.id,function(err,project) {
    if (err) {
      return res.send(500,{msg: 'Missing project.'})
    }
    if (!project) {
      return res.send(404,err);
    }
    req.project = project;
    next();
  })
};

exports.getDefaultPackageByProject = function(req, res) {
  var project = req.project;
  BuilderPackage.findOne({
    project: project._id,
    isSendQuote: false
  })
  .populate('project')
  .populate('owner')
  .populate('to.team')
  .populate('variations')
  .exec(function(err, builderPackage) {
    if (err){console.log(err); return res.send(500, err); }
    User.populate(builderPackage,[
      {path : 'owner.member._id'},
      {path : 'owner.leader'},
      {path : 'to.team.member._id'},
      {path : 'to.team.leader'}
    ],function(err,builderPackage) {
      if (err){ console.log(err);return res.send(500, err); }
      return res.json(builderPackage);
    })

  });
};

/**
 * get single package id
 */
exports.findByProject = function(req, res){
  BuilderPackage.findOne({project: req.params.id})
  .populate('project')
  .populate('owner')
  .populate('to.team')
  .populate('variations')
  .exec(function(err, builderPackage) {
    if (err){ return res.send(500, err); }
    if (!builderPackage) {return res.send(404, err);}
    User.populate(builderPackage,[
      {path : 'owner.member._id'},
      {path : 'owner.leader'},
      {path : 'to.team.member._id'},
      {path : 'to.team.leader'}
    ],function(err,builderPackage) {
      if (err){ console.log(err);return res.send(500, err); }
      return res.json(builderPackage);
    });
  });
};