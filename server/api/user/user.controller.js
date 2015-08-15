'use strict';

var User = require('./../../models/user.model');
var ResetPassword = require('./../../models/resetPassword.model');
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
var ResetPasswordValidator = require('./../../validators/resetPassword');
var UserValidator = require('./../../validators/user');
var okay = require('okay');
var async = require('async');
var _ = require('lodash');
var Mailer = require('./../../components/Mailer');
var crypto = require('crypto');

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
  UserValidator.validateNewUser(req, function(err,data) {
    if (err) {
      return res.send(422,{errors: err})
    }
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
            "member.$.status" : 'Active'
          };
          Team.update({_id : invite.element._id,'member.email' : req.body.email},{'$set' : update,'$unset' : {'member.$.email' : 1}},function(err) {
            if (err) {
              return res.send(500, err);
            }
            newUser.emailVerified = true;
            newUser.team = {
              _id : invite.element._id,
              role : 'member'
            };
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
        return res.json({token: token,emailVerified : true});
      }
    });
  });
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
      newUser.firstName = req.body.firstName;
      newUser.lastName = req.body.lastName;
      newUser.name = req.body.firstName + ' ' + req.body.lastName;
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
                    if (packageInvite.isSkipInTender) {
                      contractorPackge.winnerTeam._id = savedTeam._id;
                      contractorPackge.isAccept = true;
                    }
                    _.each(contractorPackge.to, function(to) {
                      if (to.email === packageInvite.to) {
                        to._id = savedTeam._id;
                        to.email = packageInvite.to;
                      }
                    });
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
                    if (packageInvite.isSkipInTender) {
                      materialPackage.winnerTeam._id = savedTeam._id;
                      materialPackage.isAccept = true;
                    }
                    _.each(materialPackage.to, function(to) {
                      if (to.email === packageInvite.to) {
                        to._id = savedTeam._id;
                        to.email = packageInvite.to;
                      }
                    });
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
      return res.send(404);
    }
    return res.json(user);
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
    console.log(user);
    if (user.team._id) {
      Team.findById(user.team._id, function(err, team){
        if (err) {return res.send(500,err);}
        var teamMembers = team.leader;
        _.each(team.member, function(member){
          if (member._id) {
            teamMembers.push(member._id);
          }
        });
        _.remove(teamMembers, user._id);
        team.markModified('member');
        team.markModified('leader');
        team.save();
      });
    }
    User.find({}, function(err,users){
      if (err) {return res.send(500,err);}
      return res.send(200, users);
    })
  });
};

/**
 * Change a users password
 */
exports.changePassword = function (req, res, next) {
  var user = req.user;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);
  User.findById(user._id, function (err, user) {
    if (!user.authenticate(oldPass)) {
      return res.send(422,{oldPassword : 'This password is not correct.'});
    }
    user.password = newPass;
    user.save(function(err) {
      if (err) {return validationError(res, err);}
      res.send(200);
    });
  });
};

exports.changeEmail = function(req,res) {
  var user = req.user;
  User.findById(user._id,function(err,user) {
    if (user.email == req.body.email) {
      return res.json(true);
    }
    user.changeEmailToken = crypto.randomBytes(20).toString('hex');
    var currentDate = new Date();
    user.expired = currentDate.setMinutes(currentDate.getMinutes() + 30);
    user.emailChange = req.body.email;
    user._evtName = "User.ChangeEmail";
    user.save(function(err) {
      if (err) {
        return res.send(500,err)
      }
      return res.json(true);
    })
  })
};

// exports.changePhoneNum = function(req, res, next) {
//   var userId = req.user._id;
//   var phoneNumber = req.body.phoneNumber;
//   User.findById(userId, function(err, user) {
//     user.phoneNumber = phoneNumber;
//     user.save(function(err) {
//       if (err) {return validationError(res, err);}
//       res.send(200);
//     });
//   });
// };

exports.changeProfile = function(req, res) {
  User.findById(req.user._id, function(err, user){
    if (err) {return res.send(500,err);}
    if (!user) {return res.send(404,err);}
    else {
      user.firstName = req.body.firstName;
      user.lastName = req.body.lastName;
      user.phoneNumber = req.body.phoneNumber;
      user.name = req.body.firstName +' '+req.body.lastName;
      user.save(function(err,saved){
        if (err) {return res.send(500,err);}
        return res.json(200,saved);
      })
    }
  })
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
      return res.json(404);
    }
    return res.json(user);
  });
};

exports.all = function (req, res, next) {
  User.find({},function(err,users) {
    if (err) {
      // return validationError(res,err);
      return res.send(500,err);
    }
    return res.json(users);
  });
};

exports.sendVerification = function(req,res) {
  var user = req.user;
  if(!user.emailVerified){
    Mailer.sendMail('confirm-email.html', user.email, {
      user: user,
      confirmation: config.baseUrl + 'auth/confirm-email/' + user.emailVerifyToken,
      subject: 'Confirm email from buiilt.com'
    }, function(err){
      if (err) {
        return res.send(500,err);
      }
      return res.json(true);
    });
  }else{
    return res.send(422,{msg: 'blah blah blah'})
  }
};

exports.forgotPassword = function(req,res) {
  ResetPassword.remove({email : req.body.email},function(err) {
    if (err) {
      return res.send(500,err);
    }
    ResetPasswordValidator.create(req,function(err,data) {
      if (err) {
        return res.send(422,err);
      }
      var resetPassword = new ResetPassword(data);
      resetPassword.save(function(err) {
        if (err) {
          return res.send(422,err);
        }
        return res.json(true);

      })
    })
  });

};

exports.resetPassword = function(req,res) {
  ResetPassword.findOne({resetPasswordToken : req.body.token},function(err,resetPassword) {
    if (err || !resetPassword){
      return res.send(422,err);
    }
    User.findOne({email : resetPassword.email},function(err,user) {
      if (err || !user) {
        return res.send(422,err)
      }
      user.password = req.body.password;
      user.save(function(err) {
        if (err) {return res.send(422, err);}
        resetPassword.remove();
        return res.json(true);
      });
    })
  })
};

exports.getResetPasswordToken = function(req,res) {
  ResetPassword.findOne({resetPasswordToken : req.params.id},function(err,resetPassword) {
    if (err || !resetPassword) {
      return res.send(500,err);
    }
    return res.json(resetPassword);
  })
}

/**
 * Authentication callback
 */
exports.authCallback = function (req, res, next) {
  res.redirect('/');
};
