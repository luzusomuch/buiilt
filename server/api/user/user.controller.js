'use strict';

var User = require('./../../models/user.model');
var ResetPassword = require('./../../models/resetPassword.model');
var Project = require('./../../models/project.model');
var PackageInvite = require('./../../models/packageInvite.model');
var ContractorPackage = require('./../../models/contractorPackage.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var BuilderPackageNew = require('./../../models/builderPackageNew.model');
var MaterialPackage = require('./../../models/materialPackage.model');
var People = require('./../../models/people.model');
var PeopleChat = require('./../../models/peopleChat.model');
var Board = require('./../../models/board.model');
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
var mongoose = require("mongoose");

var validationError = function (res, err) {
    return res.json(422, err);
};

exports.getUserProfile = function(req, res) {
    User.findOne({_id: req.params.id}).populate("team._id").exec(function(err, user) {
        if (err) {return res.send(500,err);}
        else if (!user) {return res.send(404, "The specific user is not existed!");}
        else {
            return res.send(200, {email: user.email, name: user.name, phoneNumber: user.phoneNumber, teamName: (user.team._id)?user.team._id.name:"This user hasn\'t got team"});
        }
    });
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
        if (!packageInvite) {return res.send(404);}
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
                var invitesList = ["addClient", "addBuilder", "addArchitect", "addSubcontractor", "addConsultant"];
                var inviteIndex = _.indexOf(invitesList, packageInvite.inviteType);
                if (inviteIndex !== -1) {
                    People.findById(packageInvite.package, function(err, people) {
                        if (err) {return res.send(500,err);}
                        else if (!people) {return res.send(404);}
                        else {
                            var type;
                            switch (invitesList[inviteIndex]) {
                                case "addClient":
                                    type = "clients";
                                    break;
                                case "addBuilder":
                                    type = "builders" ;
                                    break;
                                case "addArchitect":
                                    type = "architects" ;
                                    break;
                                case "addSubcontractor":
                                    type = "subcontractors" ;
                                    break;
                                case "addConsultant":
                                    type = "consultants" ;
                                    break;
                                default :
                                    break;
                            }
                            _.each(people[type], function(tender) {
                                _.each(tender.tenderers, function(tenderer) {
                                    console.log(tenderer);
                                    if (tenderer.email == packageInvite.to) {
                                        tenderer._id = user._id;
                                        tenderer.email = null;
                                        if (tenderer.hasSelect) {
                                            user.projects.push(packageInvite.project);
                                            user.markModified("projects");
                                            user.save();
                                        } else {
                                            var inviteToken = new InviteToken({
                                                type: 'project-invite',
                                                user: user._id,
                                                element: {
                                                    project: people.project,
                                                    type: type
                                                }
                                            });
                                            inviteToken.save(function() {
                                                return false;
                                            });
                                        }
                                    }
                                });
                            });
                            people.save(function(err) {
                                if (err) {return res.send(500,err);}
                                var data = {
                                    token: token,
                                    emailVerified: true,
                                    package: people
                                };
                                PeopleChat.findOne({project: packageInvite.project, people: people._id, $or:[{ownerEmail: packageInvite.to},{fromEmail: packageInvite.to}]}, function(err, peopleChat) {
                                    if (err) {return res.send(500,err);}
                                    else if (!peopleChat) {
                                        packageInvite.remove(function(err){
                                            if (err) {return res.send(500);}
                                            return res.json(200,data);
                                        });
                                    } else {
                                        if (peopleChat.ownerEmail) {
                                            peopleChat.owner = user._id;
                                            peopleChat.ownerEmail = null;
                                        } else if (peopleChat.fromEmail) {
                                            peopleChat.from = user._id;
                                            peopleChat.fromEmail = null;
                                        }
                                        if (peopleChat.messages.length > 0) {
                                            _.each(peopleChat.messages, function(message){
                                                if (message.email) {
                                                    if (message.email == packageInvite.to) {
                                                        message.email = null;
                                                        message.user = user._id;
                                                    }
                                                }
                                            });
                                        }
                                        peopleChat.messageType = "newRegistry";
                                        peopleChat.save(function(err){
                                            packageInvite.remove(function(err){
                                                if (err) {return res.send(500);}
                                                return res.json(200,data);
                                            });
                                        });
                                    }
                                })
                            });
                        }
                    });
                } else {
                    user.remove(function() {
                        return res.send(500);
                    });
                }
            }
        });
    });
};

/**
 * Get a single user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;

  User.findById(userId, '-salt -hashedPassword', function (err, user) {
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
        team._user = req.user;
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

exports.changeProfile = function(req, res) {
    User.findById(req.user._id, function(err, user){
        if (err) {return res.send(500,err);}
        if (!user) {return res.send(404,{message: "The specific user is not existed"});}
        else {
            if (req.body.editType === "enterCreditCard") {
                user.creditCard = req.body.creditCard;
            } else {
                user.firstName = req.body.firstName;
                user.lastName = req.body.lastName;
                user.phoneNumber = req.body.phoneNumber;
                user.name = req.body.firstName +' '+req.body.lastName;
            }
            user.save(function(err,saved){
                if (err) {return res.send(500,err);}
                return res.json(200,saved);
            });
        }
    });
};

/**
 * Get my info
 */
exports.me = function (req, res, next) {
  var userId = req.user._id;
  User.findOne({
    _id: userId
  }, '-salt -hashedPassword')
  .populate('projects').exec(function (err, user) { // don't ever give out the password or salt
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
  User.find({}, '-salt -hashedPassword',function(err,users) {
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
    Mailer.sendMail('confirm-email.html', config.emailFrom, user.email, {
      user: user,
      confirmation: config.baseUrl + 'auth/confirm-email/' + user.emailVerifyToken,
      subject: 'Confirm email from buiilt.com'
    }, function(err){
      if (err) {
        return res.send(500,err);
      } else {
        return res.json(200, 'successful');
      }
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
};

/**
 * Authentication callback
 */
exports.authCallback = function (req, res, next) {
  res.redirect('/');
};
