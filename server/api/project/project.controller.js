'use strict';

var User = require('./../../models/user.model');
var Team = require('./../../models/team.model');
var Project = require('./../../models/project.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var BuilderPackageNewVersion = require('./../../models/builderPackageNew.model');
var ValidateInvite = require('./../../models/validateInvite.model');
var errorsHelper = require('../../components/helpers/errors');
var ProjectValidator = require('./../../validators/project');
var PackageInvite = require('./../../models/packageInvite.model');
var People = require('./../../models/people.model');
var _ = require('lodash');
var async = require('async');

exports.create = function(req, res){
    var user = req.user;
    ProjectValidator.validateCreate(req,function(err,data) {
        if (err) {
            res.send(422,err);
        }
        var project = new Project(data);
        project.status = 'waiting';
        project.projectManager._id = req.user._id,
        project.projectManager.type = req.body.teamType,
        project.save(function(err) {
            if (err) {
                res.send(422,err);
            } else {
                var people = new People({
                    project: project._id
                });
                if (req.body.teamType === "builder") {
                    people.builders.push({
                        tenderName: "Builder",
                        tenderers: [{
                            _id: req.user._id,
                            teamMember: []
                        }],
                        hasSelect: true, 
                        inviter: req.user._id,
                        createAt: new Date()
                    });
                } else if (req.body.teamType === "homeOwner") {
                    people.builders.push({
                        tenderName: "Client",
                        tenderers: [{
                            _id: req.user._id,
                            teamMember: []
                        }],
                        hasSelect: true, 
                        inviter: req.user._id,
                        createAt: new Date()
                    });
                } else if (req.body.teamType === "architect") {
                    people.builders.push({
                        tenderName: "Architect",
                        tenderers: [{
                            _id: req.user._id,
                            teamMember: []
                        }],
                        hasSelect: true, 
                        inviter: req.user._id,
                        createAt: new Date()
                    });
                }
                people.save();
                User.findById(req.user._id, function(err, user) {
                    user.projects.push(project._id);
                    user.save(function(err) {
                        return res.send(200, project);
                    });
                });
            }
        });
    });
};


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




/**
 * show project detail
 */
exports.show = function(req, res){
  //TODO - validate rol
  Project.findById(req.params.id)
  .populate('owner', '_id email name')
  .exec(function(err, project){
    if(err){ return res.send(500, err); }
    else {
      return res.send(200, project);
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
    if (err) {return res.send(500,err);}
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

exports.getAll = function(req, res) {
  Project.find({}, function(err, projects){
    if (err) {return res.send(500,err);}
    return res.send(200,projects)
  })
};

exports.destroy = function (req, res) {
  Project.findByIdAndRemove(req.params.id, function (err, project) {
    if (err) {
      return res.send(500, err);
    }
    Project.find({}, function(err,projects){
      if (err) {return res.send(500,err);}
      return res.send(200, projects);
    })
  });
};

exports.updateProject = function(req, res) {
  Project.update({_id: req.params.id},
  {
    name: req.body.name, 
    description: req.body.description, 
    address: req.body.address, 
    suburb: req.body.suburb, 
    postcode: req.body.postcode
  }, function(err, saved){
    if (err) {return res.send(500,err);}
    return res.send(200,saved);
  });
};

exports.createProjectNewVersion = function(req, res) {
  var user = req.user;
  ProjectValidator.validateCreate(req,function(err,data) {
    if (err) {
      res.send(422,err);
    }
    var project = new Project(data);
    project.status = 'waiting';
    project.owner = user._id;
    project.save(function(err) {
      if (err) {
        res.send(422,err);
      }
      var people = new People({
        project: project._id
      });
      people.save();
      user.projects.push(project._id);
      user.markModified('projects');
      user.save();
      var descriptions = [];
      descriptions.push(project.description);
      var builderPackage = new BuilderPackageNewVersion({
        type: 'BuilderPackage',
        location : req.body.package.location,
        owner : user._id,
        project : project._id,
        name : project.name,
        descriptions : descriptions,
        hasArchitectManager: true,
        ownerType: req.body.selectedOwnerUserType
      });
      var projectManager = {};
      if (req.body.selectedOwnerUserType == 'homeOwner') {
        people.clients.push({
          inviter: req.user._id,
          _id: req.user._id,
          hasSelect: true
        });
        people.save();
        if (req.body.homeOwnerHireArchitect == 'true' && req.body.architectEmail) {
          if (req.body.architectEmail.length > 0) {
            User.findOne({'email': req.body.architectEmail}, function(err, _architect){
              if (err) {return res.send(500,err);}
              if (!_architect) {
                projectManager.email = req.body.architectEmail;
                projectManager.type = 'architect';
                people.architects.push({
                  inviter: req.user._id,
                  email: req.body.architectEmail,
                  hasSelect: true
                });
                people._newInviteeNotSignUp = [req.body.architectEmail];
                people._newInviteType = 'peopleArchitect';
                people.markModified('invitePeople');
                people._editUser = req.user;
                people.save();
              } else {
                _architect.projects.push(project._id);
                _architect.markModified('projects');
                _architect.save();

                people.architects.push({
                  inviter: req.user._id,
                  _id: _architect._id,
                  hasSelect: true
                });
                people._newInviteeSignUpAlready = [_architect._id];
                people._newInviteType = 'peopleArchitect';
                people.markModified('invitePeople');
                people._editUser = req.user;
                people.save();

                projectManager._id = _architect._id;
                projectManager.type = 'architect';
              }
              builderPackage.projectManager = projectManager;
              builderPackage._editUser = req.user;
              builderPackage.save(function(err){
                if (err) {
                  return res.send(500,err)
                }
                return res.json(project);
              });
            });
          } else {
            return res.send(422, {msg: 'Please check your architect email'});
          }
        } else if (req.body.homeOwnerAssignBuilder == 'true' && req.body.builderEmail) {
          if (req.body.builderEmail.length > 0) {
            User.findOne({'email': req.body.builderEmail}, function(err, _builder){
              if (err) {return res.send(500,err);}
              if (!_builder) {
                projectManager.email = req.body.builderEmail;
                projectManager.type = 'builder';

                people.builders.push({
                  inviter: req.user._id,
                  email: req.body.builderEmail,
                  hasSelect: true
                });
                people._newInviteeNotSignUp = [req.body.architectEmail];
                people._newInviteType = 'peopleBuilder';
                people.markModified('invitePeople');
                people._editUser = req.user;
                people.save();
              } else {
                _builder.projects.push(project._id);
                _builder.markModified('projects');
                _builder.save();

                people.builders.push({
                  inviter: req.user._id,
                  _id: _builder._id,
                  hasSelect: true
                });
                people._newInviteeSignUpAlready = [_builder._id];
                people._newInviteType = 'peopleBuilder';
                people.markModified('invitePeople');
                people._editUser = req.user;
                people.save();

                projectManager._id = _builder._id;
                projectManager.type = 'builder';
              }
              builderPackage.projectManager = projectManager;
              builderPackage._editUser = req.user;
              builderPackage.save(function(err){
                if (err) {
                  return res.send(500,err)
                }
                return res.json(project);
              });
            });
          } else {
            return res.send(422, {msg: 'Please check your builder email'});
          }
        } else if (req.body.homeOwnerHireArchitect == 'false' && req.body.homeOwnerAssignBuilder == 'false') {
          User.findById(req.user._id, function(err, _user){
            if (err) {return res.send(500,err);}
            else {
              projectManager._id = _user._id;
              projectManager.type = 'homeOwner';
              _user.projects.push(project._id);
              _user.markModified('projects');
              _user.save();
            }
            builderPackage.projectManager = projectManager;
            builderPackage._editUser = _user;
            builderPackage.save(function(err){
              if (err) {
                return res.send(500,err)
              }
              return res.json(project);
            });
          });
        } else {
          return res.send(422, {msg: 'Please check your input'});
        }
      } else if (req.body.selectedOwnerUserType == 'architect') {
        people.architects.push({
          inviter: req.user._id,
          _id: req.user._id,
          hasSelect: true
        });
        people.save();
        if (req.body.architectManagerHisProject == 'true') {
          builderPackage.projectManager._id = user._id;
          builderPackage.projectManager.type = 'architect';
          builderPackage._editUser = user;
          builderPackage.save(function(err){
            if (err) {
              return res.send(500,err)
            }
            return res.json(project);
          });
        } else if (req.body.architectManagerHisProject == 'false') {
          if (req.body.haveContracted == 'true' && req.body.homeOwnerEmail) {
            if (req.body.homeOwnerEmail.length > 0) {
              User.findOne({email: req.body.homeOwnerEmail}, function(err, _homeOwner){
                if (err) {return res.send(500,err);}
                if (!_homeOwner) {
                  projectManager = {
                    email: req.body.homeOwnerEmail,
                    type: 'homeOwner'
                  };

                  people.clients.push({
                    inviter: req.user._id,
                    email: req.body.homeOwnerEmail,
                    hasSelect: true
                  });
                  people._newInviteeNotSignUp = [req.body.homeOwnerEmail];
                  people._newInviteType = 'peopleClient';
                  people.markModified('invitePeople');
                  people._editUser = req.user;
                  people.save();
                } else {
                  builderPackage.projectManager = {
                    _id: _homeOwner._id,
                    type: 'homeOwner'
                  };

                  people.clients.push({
                    inviter: req.user._id,
                    _id: _homeOwner._id,
                    hasSelect: true
                  });
                  people._newInviteeSignUpAlready = [_homeOwner._id];
                  people._newInviteType = 'peopleClient';
                  people.markModified('invitePeople');
                  people._editUser = req.user;
                  people.save();

                  _homeOwner.projects.push(project._id);
                  _homeOwner.markModified('projects');
                  _homeOwner.save();
                }
                builderPackage.projectManager = projectManager;
                builderPackage._editUser = user;
                builderPackage.save(function(err){
                  if (err) {
                    return res.send(500,err)
                  }
                  return res.json(project);
                });
              });
            } else {
              return res.send(422, {msg : 'Please check home owner email.'});
            }
          } else if (req.body.haveContracted == 'false' && req.body.builderEmail){
            if (req.body.builderEmail.length > 0) {
              User.findOne({email: req.body.builderEmail}, function(err, _builder){
                if (err) {return res.send(500,err);}
                if (!_builder) {
                  builderPackage.projectManager = {
                    email: req.body.builderEmail,
                    type: 'builder'
                  };

                  people.builders.push({
                    inviter: req.user._id,
                    email: req.body.builderEmail,
                    hasSelect: true
                  });
                  people._newInviteeNotSignUp = [req.body.builderEmail];
                  people._newInviteType = 'peopleBuilder';
                  people.markModified('invitePeople');
                  people._editUser = req.user;
                  people.save();
                } else {
                  builderPackage.projectManager = {
                    _id: _builder._id,
                    type: 'builder'
                  };

                  people.builders.push({
                    inviter: req.user._id,
                    _id: _builder._id,
                    hasSelect: true
                  });
                  people._newInviteeSignUpAlready = [_builder._id];
                  people._newInviteType = 'peopleBuilder';
                  people.markModified('invitePeople');
                  people._editUser = req.user;
                  people.save();

                  _builder.projects.push(project._id);
                  _builder.markModified('projects');
                  _builder.save();
                }
                builderPackage._editUser = user;
                builderPackage.save(function(err){
                  if (err) {
                    return res.send(500,err)
                  }
                  return res.json(project);
                });
              });
            } else {
              return res.send(422,{msg : 'Please check your builder email.'}); 
            }
          } else {
            return res.send(422,{msg : 'Please check your input.'});
          }
        }
      } else if (req.body.selectedOwnerUserType == 'builder') {
        people.builders.push({
          inviter: req.user._id,
          _id: req.user._id,
          hasSelect: true
        });
        people.save();
        if (req.body.builderHireArchitect == 'true' && req.body.architectEmail) {
          if (req.body.architectEmail.length > 0) {
            User.findOne({'email': req.body.architectEmail}, function(err, _architect){
              if (err) {return res.send(500,err);}
              if (!_architect) {
                projectManager.email = req.body.architectEmail;
                projectManager.type = 'architect';

                people.architects.push({
                  inviter: req.user._id,
                  email: req.body.architectEmail,
                  hasSelect: true
                });
                people._newInviteeNotSignUp = [req.body.architectEmail];
                people._newInviteType = 'peopleArchitect';
                people.markModified('invitePeople');
                people._editUser = req.user;
                people.save();
              } else {
                _architect.projects.push(project._id);
                _architect.markModified('projects');
                _architect.save();

                people.architects.push({
                  inviter: req.user._id,
                  _id: _architect._id,
                  hasSelect: true
                });
                people._newInviteeSignUpAlready = [_architect._id];
                people._newInviteType = 'peopleArchitect';
                people.markModified('invitePeople');
                people._editUser = req.user;
                people.save();

                projectManager._id = _architect._id;
                projectManager.type = 'architect';
              }
              builderPackage.projectManager = projectManager;
              builderPackage._editUser = req.user;
              builderPackage.save(function(err){
                if (err) {
                  return res.send(500,err)
                }
                return res.json(project);
              });
            });
          } else {
            return res.send(422, {msg: 'Please check your architect email'});
          }
        } else if (req.body.builderAssignHomeOwner == 'false' && req.body.homeOwnerEmail) {
          if (req.body.homeOwnerEmail.length > 0) {
            User.findOne({'email': req.body.homeOwnerEmail}, function(err, _builder){
              if (err) {return res.send(500,err);}
              if (!_builder) {
                projectManager.email = req.body.homeOwnerEmail;
                projectManager.type = 'homeOwner';

                people.clients.push({
                  inviter: req.user._id,
                  email: req.body.homeOwnerEmail,
                  hasSelect: true
                });
                people._newInviteeNotSignUp = [req.body.homeOwnerEmail];
                people._newInviteType = 'peopleClient';
                people.markModified('invitePeople');
                people._editUser = req.user;
                people.save();
              } else {
                _builder.projects.push(project._id);
                _builder.markModified('projects');
                _builder.save();

                people.clients.push({
                  inviter: req.user._id,
                  _id: _builder._id,
                  hasSelect: true
                });
                people._newInviteeSignUpAlready = [_builder._id];
                people._newInviteType = 'peopleClient';
                people.markModified('invitePeople');
                people._editUser = req.user;
                people.save();

                projectManager._id = _builder._id;
                projectManager.type = 'homeOwner';
              }
              builderPackage.projectManager = projectManager;
              builderPackage._editUser = req.user;
              builderPackage.save(function(err){
                if (err) {
                  return res.send(500,err)
                }
                return res.json(project);
              });
            });
          } else {
            return res.send(422, {msg: 'Please check your home owner email'});
          }
        } else if (req.body.builderHireArchitect == 'false' && req.body.builderAssignHomeOwner == 'true') {
          User.findById(req.user._id, function(err, _user){
            if (err) {return res.send(500,err);}
            else {
              projectManager._id = _user._id;
              projectManager.type = 'builder';
              _user.projects.push(project._id);
              _user.markModified('projects');
              _user.save();
            }
            builderPackage.projectManager = projectManager;
            builderPackage._editUser = _user;
            builderPackage.save(function(err){
              if (err) {
                return res.send(500,err)
              }
              return res.json(project);
            });
          });
        } else {
          return res.send(422, {msg: 'Please check your input'});
        }
      }
    });
  });
};