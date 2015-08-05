'use strict';

var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var StaffPackage = require('./../../models/staffPackage.model');
var errorsHelper = require('../../components/helpers/errors');
var ProjectValidator = require('./../../validators/project');
var _ = require('lodash');
var async = require('async');

exports.getPackageByProject = function(req, res) {
  BuilderPackage.findOne({'project': req.params.id}, function(err, builderPackages) {
    if (err) 
      return res.send(500, err);
    // console.log(builderPackages);
    res.json(200, builderPackages);
  });
};

