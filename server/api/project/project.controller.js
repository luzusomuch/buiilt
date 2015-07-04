'use strict';

var User = require('./../../models/user.model');
var Team = require('./../../models/team.model');
var Project = require('./../../models/project.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var ValidateInvite = require('./../../models/validateInvite.model');
var errorsHelper = require('../../components/helpers/errors');
var ProjectValidator = require('./../../validators/project');
var PackageInvite = require('./../../models/packageInvite.model');
var _ = require('lodash');
var async = require('async');

exports.index = function(req, res) {
  Project.find({'user._id': req.user._id}, function(err, projects) {
    if (err)
      return res.send(500, err);
    res.json(200, projects);
  });
};

exports.team = function(req,res,next) {
  Team.findById(req.params.id,function(err,team) {
    if (err || !team) {
      return res.send(422,err);
    }
    req.team = team;
    next();
  })
};



exports.create = function(req, res){
  var user = req.user;
  ProjectValidator.validateCreate(req,function(err,data) {
    if (err) {
      res.send(422,err);
    }
    var project = new Project(data);
    project.status = 'waiting';
    project.owner = user.team._id;
    project.save(function(err) {
      if (err) {
        res.send(422,err);
      }
      var to = {};
      Team.findById(user.team._id,function(err,team) {
        team.project.push(project._id);
        team.markModified('project');
        team.save();
        if (team.type == 'builder') {
          to.type = 'homeOwner'
        } else {
          to.type = 'builder'
        }
      });
      User.findOne({email : req.body.package.to},function(err,_user) {
        if (!_user) {
          to.email = req.body.package.to;
        } else {
          to.team = _user.team._id;
        }
        var builderPackage = new BuilderPackage({
          type: 'BuilderPackage',
          location : req.body.package.location,
          owner : user.team._id,
          project : project._id,
          name : project.name,
          description : project.description
        });
        builderPackage.to = to;
        builderPackage.save(function(err) {
          if (err) {
            return res.send(500,err)
          }
          return res.json(project);
        })
      })
    })
  });
};

/**
 * show project detail
 */
exports.show = function(req, res){
  //TODO - validate rol
  Project.findById(req.params.id)
  .populate('owner')
  .exec(function(err, project){
    if(err){ return res.send(500, err); }
    else {
      User.populate(project, [
        {path : 'owner.member._id'},
        {path : 'owner.leader'}
      ],function(err,_project) {
        if (err) {
          return res.send(500, err);
        }
        return res.json(_project);
      })
    }
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
  var _projects = [];
  Team.findOne({$or: [{'leader': req.params.id}, {'member._id': req.params.id}]}, function(err, team) {
    if (err) {return res.send(500, err);}
    if (!team) {return res.send(404, err);}
    else {
      async.each(team.leader, function(leader, callback) {
        Project.find({'user._id': leader}, function(err, projects) {
          if (err) {callback(err);}
          if (!projects) {callback(err);}
          else {
            _projects = _.merge(_projects,projects);
            callback();
          }
        });
      }, function(err){
        return res.json(_projects);
      });
      // Project.find({'builder._id': team._id}, function(err, projects){
      //   if (err) {return res.send(500, err);}
      //   else {
      //     return res.json(200, projects);
      //   }
      // });
    }
  });
  // Team.findOne({$or: [{'leader': req.params.id}, {'member._id': req.params.id}]}, function(err, team) {
  //   if (err) {return res.send(500, err);}
  //   if (!team) {return res.send(404, err);}
  //   else {
  //     Project.find({'user._id': team.user}, function(err, projects){
  //       if (err) {return res.send(500, err);}
  //       else {
  //         return res.json(200, projects);
  //       }
  //     });
  //   }
  // });
};

exports.getProjectsByBuilder = function(req, res) {
  var _projects = [];
  Team.findOne({$or: [{'leader': req.params.id}, {'member._id': req.params.id}]}, function(err, team) {
    if (err) {return res.send(500, err);}
    if (!team) {return res.send(404, err);}
    else {
      async.each(team.leader, function(leader, callback) {
        Project.find({'builder._id': leader}, function(err, projects) {
          if (err) {callback(err);}
          if (!projects) {callback(err);}
          else {
            _projects = _.merge(_projects,projects);
            callback();
          }
        });
      }, function(err){
        return res.json(_projects);
      });
      // Project.find({'builder._id': team._id}, function(err, projects){
      //   if (err) {return res.send(500, err);}
      //   else {
      //     return res.json(200, projects);
      //   }
      // });
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