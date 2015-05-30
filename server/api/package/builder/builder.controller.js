'use strict';

var User = require('./../../../models/user.model');
var Project = require('./../../../models/project.model');
var BuilderPackage = require('./../../../models/builderPackage.model');
var errorsHelper = require('./../../../components/helpers/errors');
var ProjectValidator = require('./../../../validators/project');
var _ = require('lodash');
var async = require('async');

exports.getDefaultPackagePackageByProject = function(req, res) {
  if (!req.query.project) {
    return res.status(400).json({msg: 'Missing project.'});
  }
  //TODO - validate user rol in the project

  BuilderPackage.findOne({
    project: req.query.project,
    isSendQuote: false
  }, function(err, builderPackage) {
    if (err){ return res.send(500, err); }

    res.json(builderPackage);
  });
};