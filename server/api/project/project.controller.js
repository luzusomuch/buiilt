'use strict';

var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var errorsHelper = require('../../components/helpers/errors');
var ProjectValidator = require('./../../validators/project');
var _ = require('lodash');
var async = require('async');

exports.index = function(req, res) {
  Project.find({'user._id': req.user._id}, function(err, projects) {
    if (err) 
      return res.send(500, err);
    res.json(200, projects);
  });
}
/**
 * create a new project
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */
exports.create = function(req, res){
  ProjectValidator.validateCreate(req, function(err, data) {
    if (err) {return errorsHelper.validationErrors(res, err, 'Validation');}
    var project = new Project(data);
    project.user = req.user;
    
    async.each(project.requestedHomeBuilders, function(builder, callback) {
      User.findOne({'email' : builder.email}, function(err, user) {
        if (user) {
          builder._id=user._id;
          builder.phoneNumber=user.phoneNumber;
        }
        callback();
      });
    }, function(err) {
      if (err) {
        console.log(err);
      }
      else {
        project.save(function(err, savedProject) {
          if (err) {
            return errorsHelper.validationErrors(res, err);
         }
          var builderPackage = new BuilderPackage();
          builderPackage.user = project.user._id;
          builderPackage.description = project.description;
          builderPackage.project = project._id;
          builderPackage.save(function (err, savedBuilderPackage) {
            if (err) { return errorsHelper.validationErrors(res, err);}
            return res.json(savedBuilderPackage);
          });
        });
      }
    });
  })
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

exports.update = function(req, res) {
  var quote = req.body.requestedHomeBuilders.quote;
  var currentUser = req.user;
  Project.findById(req.params.id, function(err, project){
    _.each(project.requestedHomeBuilders, function(requestedHomeBuilder) {
      if (currentUser.email == requestedHomeBuilder.email) {
        requestedHomeBuilder.quote = 123;
        project.save(function (err) {
          if (err){
            return errorsHelper.validationErrors(res, err);
          }
          res.send(200);
        });
      }
    });
  });
  
};