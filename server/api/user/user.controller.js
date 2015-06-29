'use strict';

var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var PackageInvite = require('./../../models/packageInvite.model');
var ContractorPackage = require('./../../models/contractorPackage.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var MaterialPackage = require('./../../models/materialPackage.model');
var Team = require('./../../models/team.model');
var InviteToken = require('./../../models/inviteToken.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var UserValidator = require('./../../validators/user');
var okay = require('okay');
var async = require('async');
var _ = require('lodash');

var validationError = function (res, err) {
  return res.json(422, err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function (req, res) {
  User.find({}, '-salt -hashedPassword', function (err, users) {
    if (err)
      return res.send(500, err);
    res.json(200, users);
  });
};
/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
  var invite = req.body.invite;
  UserValidator.validateNewUser(req, okay(next, function (data) {
    var newUser = new User(data);
    newUser.provider = 'local';
    newUser.role = 'user';
    newUser.name = data.firstName + ' ' + data.lastName;
    newUser.save(function (err, user) {
      if (err) {
        return validationError(res, err);
      }
      //update project for user
      var token = jwt.sign({_id: user._id}, config.secrets.session, {expiresInMinutes: 60 * 5});
      Project.find({'user.email': req.body.email}, function (err, projects) {
        if (err) {
        }
        else {
          _.each(projects, function (project) {
            if (project.type === 'FromBuilderToHomeOwner') {
              User.findOne({'email': project.user.email},function(err, user) {
                if (err) {return res.send(500, err);}
                if (!user) {return res.send(404,err);}
                else {
                  if (user.email === req.body.email && !project.user._id) {
                    project.user._id = user._id;
                    project.save();
                  }
                }
              });
            }
          });
        }
      });
      // If has invite token
      if (invite) {
        if (invite.type == 'team-invite') {
          var update = {
            "member.$._id" : newUser._id,
            "member.$.status" : (invite.accept) ? 'Active' : 'Reject'
          };
          Team.update({_id : invite.element._id,'member.email' : req.body.email},{'$set' : update,'$unset' : {'member.$.email' : 1}},function(err) {
            if (err) {
              return res.send(500, err);
            }
            newUser.emailVerified = true;
            if (invite.accept) {
              newUser.team = {
                _id : invite.element._id,
                role : 'member'
              }
            }
            newUser.save(function() {
              InviteToken.remove({_id : invite._id},function(err) {
                if (err) {
                  return res.send(500,err);
                }
                return res.json({token: token,emailVerified : true});
              });

            });
          })
        }
      }
      else {
        return res.json({token: token,emailVerified : false});
      }
    });
  }));
};

//create user with invite token
exports.createUserWithInviteToken = function(req, res, next) {
  PackageInvite.findById(req.body.packageInviteToken, function(err, packageInvite) {
    if (err) {return res.send(500,err);}
    else {
      var newUser = new User();
      newUser.email = packageInvite.to;
      newUser.password = req.body.password;
      newUser.provider = 'local';
      newUser.role = 'user';
      newUser.emailVerified = true;
      newUser.save(function(err, user){
        if (err) {return validationError(res, err);}
        else {
          var token = jwt.sign({_id: user._id}, config.secrets.session, {expiresInMinutes: 60 * 5});
          // res.json({token: token,emailVerified : true});
          var team = new Team({
            name: req.body.teamName,
            type: packageInvite.inviteType
          });
          team.leader.push(user._id);
          team.project.push(packageInvite.project);

          team.save(function(err, savedTeam){
            if (err) {return res.send(500,err);}
            else {
              user.team = {
                _id : savedTeam._id,
                role : 'admin'
              };
              user.save();
              if (packageInvite.inviteType == 'contractor') {
                ContractorPackage.findById(packageInvite.package, function(err, contractorPackge){
                  if (err) {return res.send(500);}
                  else {
                    // var packageTo = contractorPackge.to;
                    _.each(contractorPackge.to, function(to) {
                      if (to.email === packageInvite.to) {
                        to._id = savedTeam._id;
                        to.email = packageInvite.to;
                        // contractorPackge.to.push({
                        //   _id: savedTeam._id,
                        //   email: packageInvite.to
                        // });
                      }
                    });
                    // contractorPackge.to = packageTo;
                    contractorPackge.save(function(err, saved) {
                      if (err) {return res.send(500,err);}
                      else {
                        var data = {
                          token: token,
                          emailVerified: true,
                          package: saved
                        };
                        return res.json(200,data);
                      }
                    });
                  }
                });
              }
              else if(packageInvite.inviteType == 'supplier') {
                MaterialPackage.findById(packageInvite.package, function(err, materialPackage){
                  if (err) {return res.send(500);}
                  else {
                    // var packageTo = materialPackage.to;
                    _.each(materialPackage.to, function(to) {
                      if (to.email === packageInvite.to) {
                        to._id = savedTeam._id;
                        to.email = packageInvite.to;
                        // materialPackage.to.push({
                        //   _id: savedTeam._id,
                        //   email: packageInvite.to
                        // });
                      }
                    });
                    // materialPackage.to = packageTo;
                    materialPackage.save(function(err, saved) {
                      if (err) {return res.send(500,err);}
                      else {
                        var data = {
                          token: token,
                          emailVerified: true,
                          package: saved
                        };
                        return res.json(200,data);
                      }
                    });
                  }
                });
              }
              else if(packageInvite.inviteType == 'builder') {
                BuilderPackage.findById(packageInvite.package, function(err, builderPackage){
                  if (err) {return res.send(500);}
                  else {
                    Project.findById(packageInvite.project, function(err,project){
                      if (err) {return res.send(500,err);}
                      else {
                        project.status = 'open';
                        project.save()
                      }
                    });
                    builderPackage.to.team = savedTeam._id;
                    builderPackage.to.email = null;
                    builderPackage.save(function(err, saved){
                      if (err) {return res.send(500,err);}
                      else {
                        packageInvite.remove();
                        var data = {
                          token: token,
                          emailVerified: true,
                          package: saved
                        };
                        return res.json(200, data);
                      }
                    });
                  }
                });
              }
              else if(packageInvite.inviteType == 'homeOwner'){
                BuilderPackage.findById(packageInvite.package, function(err, builderPackage){
                  if (err) {return res.send(500);}
                  else {
                    Project.findById(packageInvite.project, function(err,project){
                      if (err) {return res.send(500,err);}
                      else {
                        project.status = 'open';
                        project.save(function(err, savedProject){
                          savedTeam.project.push(savedProject._id);
                          savedTeam.save();
                        });
                      }
                    });
                    builderPackage.to.team = savedTeam._id;
                    builderPackage.to.email = null;
                    builderPackage.save(function(err, saved){
                      if (err) {return res.send(500,err);}
                      else {
                        var data = {
                          token: token,
                          emailVerified: true,
                          package: saved
                        };
                        return res.json(200, data);
                      }
                    });
                  }
                });
              }
            }
          });
        }
      });
    }
  });
};

/**
 * Get a single user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;

  User.findById(userId, function (err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.send(401);
    }
    res.json(user);
  });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function (req, res) {
  User.findByIdAndRemove(req.params.id, function (err, user) {
    if (err) {
      return res.send(500, err);
    }
    return res.send(204);
  });
};

/**
 * Change a users password
 */
exports.changePassword = function (req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findById(userId, function (err, user) {
    user.password = newPass;
    user.save(function(err) {
      if (err) {return validationError(res, err);}
      res.send(200);
    });
    // if (user.authenticate(oldPass)) {
    //   user.password = newPass;
    //   user.save(function (err) {
    //     if (err) {
    //       return validationError(res, err);
    //     }
    //     res.send(200);
    //   });
    // } else {
    //   res.send(403);
    // }
  });
};

exports.changePhoneNum = function(req, res, next) {
  var userId = req.user._id;
  var phoneNumber = String(req.body.phoneNumber);
  User.findById(userId, function(err, user) {
    user.phoneNumber = phoneNumber;
    user.save(function(err) {
      if (err) {return validationError(res, err);}
      res.send(200);
    });
  });
};

/**
 * Get my info
 */
exports.me = function (req, res, next) {
  var userId = req.user._id;
  User.findOne({
    _id: userId
  }, '-salt -hashedPassword', function (err, user) { // don't ever give out the password or salt
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.json(401);
    }
    res.json(user);
  });
};

exports.all = function (req, res, next) {
  User.find({},function(err,users) {
    if (err) {
      return validationError(res,err);
    }
    res.json(users);
  });
};

/**
 * Authentication callback
 */
exports.authCallback = function (req, res, next) {
  res.redirect('/');
};
