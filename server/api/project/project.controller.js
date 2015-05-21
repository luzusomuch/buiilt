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
    console.log(data);
    if(err){ return errorsHelper.validationErrors(res, err, 'Validation'); }

    //create a new project
    var project = new Project(data);
    project.user = req.user;
    project.save(function(err, savedProject){
      if(err){ return errorsHelper.validationErrors(res, err); }

      //return public data of project
      return res.json(savedProject);
    });
  });
};

/**
 * show project detail
 */
exports.show = function(req, res){
  //TODO - validate rol
  Project.findById(req.params.id)
  .populate('user')
  .populate('homeBuilder')
  .exec(function(err, project){
    if(err){ return errorsHelper.validationErrors(res, err); }

    return res.json(project);
  });
};