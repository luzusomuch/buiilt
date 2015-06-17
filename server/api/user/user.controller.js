'use strict';

var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var Team = require('./../../models/team.model');
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
  var teamInviteToken = (req.body.teamInviteToken) ? req.body.teamInviteToken : null;
  var emailVerified = false;
  UserValidator.validateNewUser(req, okay(next, function (data) {
    var newUser = new User(data);
    newUser.provider = 'local';
    newUser.role = 'user';
    newUser.save(function (err, user) {
      if (err) {
        return validationError(res, err);
      }
      //update project for user
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
      if (teamInviteToken) {
        //update teams for group user
        Team.update({teamInviteToken : teamInviteToken,'member.email': req.body.email},
          {"$set" : {
            "member.$._id" : user._id,
            "member.$.status" : 'Active',
            "member.$.email" : null
          }}, function(err, team) {
            if (err) {console.log(err);return res.send(500, err);}
            Team.findOne({teamInviteToken : teamInviteToken},function(err,team) {
              newUser.team = {
                _id : team._id,
                role : 'member'
              };
              newUser.emailVerified = true;
              emailVerified = true;
              newUser.save(function() {
                var token = jwt.sign({_id: user._id}, config.secrets.session, {expiresInMinutes: 60 * 5});
                res.json({token: token,emailVerified : true});
              });
            })
          });
      } else {
        var token = jwt.sign({_id: user._id}, config.secrets.session, {expiresInMinutes: 60 * 5});
        res.json({token: token,emailVerified : false});
      }

    });
  }));
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
  console.log(userId);
  console.log(req.body.phoneNumber);
  var phoneNumber = String(req.body.phoneNumber);
  console.log(phoneNumber);
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
    console.log(user);
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
