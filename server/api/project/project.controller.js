'use strict';

var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var errorsHelper = require('../../components/helpers/errors');
var ProjectValidator = require('./../../validators/project');

/**
 * create a new project
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */
exports.create = function(req, res){
  ProjectValidator.validateCreate(req, function(err, data){
    if(err){ return errorsHelper.validationErrors(res, err, 'Validation'); }

    //create a new project
    var project = new Project(data);
    project.save(function(err, savedProject){
      if(err){ return errorsHelper.validationErrors(res, err); }

      //return public data of project
      return res.json(savedProject);
    });
  });
};