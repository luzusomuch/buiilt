'use strict';

var User = require('./../../models/user.model');
var Team = require('./../../models/team.model');
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
};

/**
 * create a new project
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */
exports.create = function(req, res){
  Team.findOne({leader: req.user._id}, function(err, team){
    if (err) {return res.send(500,err);}
    if (!team) {return res.send(404,err);}
    else{
      if (team.type === 'homeOwner') {
        var project = new Project({
          name: req.body.name,
          description: req.body.description,
          user: {_id: req.user._id, email: req.user.email},
          type: 'FromHomeOwnerToBuilder'
        });
        User.findOne({'email': req.body.email}, function(err, user){
          if (err) {return res.send(500,err);}
          if (!user) {
            project.builder.email = req.body.email;
            project.save(function(err,saved) {
              if (err) {return res.send(500,err);}
              else {
                var builderPackage = new BuilderPackage({
                  location: {
                    address: req.body.location.address,
                    postcode: req.body.location.postcode,
                    suburb: req.body.location.suburb
                  },
                  project: saved._id,
                  name: saved.name,
                  description: saved.description
                });
                builderPackage.save(function(err, saved){
                  if (err) {return res.send(500, err);}
                  else {
                    return res.json(200,saved);
                  }
                });
              }
            });
          }
          else {
            project.builder._id = user._id;
            project.builder.email = user.email;
            project.save(function(err,saved) {
              if (err) {return res.send(500,err);}
              else {
                console.log(saved);
                var builderPackage = new BuilderPackage({
                  location: {
                    address: req.body.location.address,
                    postcode: req.body.location.postcode,
                    suburb: req.body.location.suburb
                  },
                  user: saved.builder._id,
                  project: saved._id,
                  name: saved.name,
                  description: saved.description
                });
                builderPackage.save(function(err, saved){
                  if (err) {return res.send(500, err);}
                  else {
                    return res.json(200,saved);
                  }
                });
              }
            });
          }
        });
      }
      else if(team.type === 'buider') {
        var project = new Project({
          name: req.body.name,
          description: req.body.description,
          builder: {_id: req.user._id, email: req.user.email},
          type: 'FromBuilderToHomeOwner'
        });
        User.findOne({'email': req.body.email}, function(err, user){
          if (err) {return res.send(500,err);}
          if (!user) {
            project.user.email = req.body.email;
            project.save(function(err, saved){
              if (err) {return res.send(500,err);}
              else {
                var builderPackage = new BuilderPackage({
                  location: {
                    address: req.body.location.address,
                    postcode: req.body.location.postcode,
                    suburb: req.body.location.suburb
                  },
                  user: saved.builder._id,
                  project: saved._id,
                  name: saved.name,
                  description: saved.description
                });
                builderPackage.save(function(err, saved){
                  if (err) {return res.send(500, err);}
                  else {
                    return res.json(200,saved);
                  }
                });
              }
            });
          }
          else {
            // project.user._id = user._id;
            project.user.email = user.email;
            project.save(function(err, saved){
              if (err) {return res.send(500,err);}
              else {
                var builderPackage = new BuilderPackage({
                  location: {
                    address: req.body.location.address,
                    postcode: req.body.location.postcode,
                    suburb: req.body.location.suburb
                  },
                  user: saved.builder._id,
                  project: saved._id,
                  name: saved.name,
                  description: saved.description
                });
                builderPackage.save(function(err, saved){
                  if (err) {return res.send(500, err);}
                  else {
                    return res.json(200,saved);
                  }
                });
              }
            });
          }
        });
      }
    }
  });
  

  // ProjectValidator.validateCreate(req, function(err, data) {
  //   if (err) {return errorsHelper.validationErrors(res, err, 'Validation');}
  //   var project = new Project(data);

  //   //get current user team type
  //   Team.findOne({user: req.user._id}, function(err, team) {
  //     if (err) {return res.send(500, err);}
  //     if (!team) {return res.send(404, err);}
  //     else {
  //       if (team.type === 'homeOwner' ) {

  //       }
  //       else if(team.type === 'buider') {

  //       }
  //     }
  //   });
  //   project.builder = data.user;
  //   project.save(function(err, savedProject) {
  //     if (err) { return errorsHelper.validationErrors(res, err); }

  //     //create new builder package
  //     var builderPackage = new BuilderPackage({
  //       user: data.user,
  //       project: savedProject._id,
  //       name: savedProject.name,
  //       description: savedProject.description
  //     });

  //     builderPackage.save(function (err, savedBuilderPackage) {
  //       if (err) { return errorsHelper.validationErrors(res, err);}

  //       return res.json(savedBuilderPackage);
  //     });
  //   });
  // });
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
  var currentUser = req.user;
  Project.findById(req.params.id, function(err, project){
    _.each(project.requestedHomeBuilders, function(requestedHomeBuilder) {
      if (currentUser.email == requestedHomeBuilder.email) {
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

exports.selectWinner = function(req, res) {
  Project.findById(req.params.id, function(err, project) {
    if (err) {console.log(err);}
    else {
      project.quote = req.body.quote;
      project.homeBuilder = req.body.homeBuilder;
      project.email = req.body.email;
      project.save();
    }
  });
};

exports.getProjectsByUser = function(req, res) {
  Team.findOne({$or: [{'leader': req.params.id}, {'member._id': req.params.id}]}, function(err, team) {
    if (err) {return res.send(500, err);}
    if (!team) {return res.send(404, err);}
    else {
      Project.find({'user._id': team.user}, function(err, projects){
        if (err) {return res.send(500, err);}
        else {
          return res.json(200, projects);
        }
      });
    }
  });
};

exports.getProjectsByBuilder = function(req, res) {
  Team.findOne({$or: [{'leader': req.params.id}, {'member._id': req.params.id}]}, function(err, team) {
    if (err) {return res.send(500, err);}
    if (!team) {return res.send(404, err);}
    else {
      console.log(team);
      Project.find({'builder._id': team.user}, function(err, projects){
        if (err) {return res.send(500, err);}
        else {
          return res.json(200, projects);
        }
      });
    }
  });
  // Project.find({'builder._id': req.params.id}, function(err, projects) {
  //   if (err) {return res.send(500, err);}
  //   if (!projects) {return res.send(404, err);}
  //   else {
  //     return res.json(projects);
  //   }
  // })
};

/**
 * get default package of the project (isSendquote = false)
 */
exports.getDefaultPackage = function(req, res){
  
};