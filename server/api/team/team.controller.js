'use strict';

var User = require('./../../models/user.model');
var Team = require('./../../models/team.model');
var Task = require('./../../models/task.model');
var StaffPackage = require('./../../models/staffPackage.model');
var errorsHelper = require('../../components/helpers/errors');
var ValidateInvite = require('./../../models/validateInvite.model');
var TeamValidator = require('./../../validators/team');
var NotificationHelper = require('./../../components/helpers/notification');
var _ = require('lodash');
var async = require('async');


exports.isWaitingTeamAccept = function(req, res) {
  Team.findOne({"member._id": req.user._id}, function(err, team) {
    if (err) {return res.send(500,err);}
    if (!team) {return res.send(200, {data: false});}
    return res.send(200, {data: true});
  });
};

exports.team = function (req,res,next) {
  Team.findById(req.params.id,function(err,team) {
    if (err || !team) {
      return errorsHelper.validationErrors(res, "Team not found")
    }
    req.team = team;

    next();
  })
};

exports.getAll = function(req, res) {
  Team.find({}, "_id name", function(err, teams) {
    if (err) {return res.send(500,err);}
    return res.send(200,teams);
  });
};

exports.sendJoinTeamRequest = function(req, res) {
  Team.findById(req.params.id, function(err, team) {
    if (err) {return res.send(500,err);}
    if (!team) {return res.send(404);}
    team.member.push({_id: req.user._id, status: "Waiting"});
    team._user = req.user;
    team.save(function(err) {
      if (err) {return res.send(500,err);}
      var params = {
        owners: team.leader,
        fromUser: req.user._id,
        element: team,
        referenceTo : 'team',
        type : 'join-team-request'
      };
      NotificationHelper.create(params,function(err) {
        if (err) {
          return res.send(500,err);
        }
        return res.send(200);
      });
    });
  });
};

exports.acceptJoinRequest = function(req, res) {
  Team.findById(req.params.id, function(err, team) {
    if (err) {return res.send(500,err);}
    if (!team) {return res.send(404);}
    var currentTeamRequestIndex = _.findIndex(team.member, function(member) {
      if (member._id && member.status==="Waiting") {
        return member._id.toString()===req.query.memberId.toString();
      }
    });
    team.member[currentTeamRequestIndex].status = "Active";
    team._user = req.user;
    team.save(function(err) {
      if (err) {return res.send(500,err);}
      Team.populate(team, [
        {path: "leader", select: "_id name email phoneNumber"},
        {path: "member._id", select: "_id name email phoneNumber"}
      ], function(err, team) {
        if (err) {return res.send(500,err);}
        var params = {
          owners: [req.query.memberId],
          fromUser: req.user._id,
          element: team,
          referenceTo: "team",
          type: "accept-team-request"
        };
        NotificationHelper.create(params,function(err) {
          if (err) {
            return res.send(500,err);
          }
          User.findById(req.query.memberId, function(err, user) {
            if (err) {return res.send(500,err);}
            if (!user) {return res.send(404);}
            user.team = {_id: team._id, role: "member"};
            user.save(function(err){
              if (err) {return res.send(500,err);}
              return res.send(200, team);
            });
          });
        });
      });
    });
  });
};

exports.index = function (req, res) {
    Team.findById(req.query.teamId)
    .populate("leader", "_id name email")
    .populate("member._id", "_id name email")
    .exec(function(err, team) {
        if (err) {return res.send(500,err);}
        if (!team) {return res.send(404);}
        return res.send(200, team);
    });
};

exports.me = function(req,res) {
  var user = req.user;
  if (!user.team) {
    // return res.json(null);
    return res.send(500);
  }
  Team.findById(user.team._id)
    .populate('leader', '-hashedPassword -salt')
    .populate('member._id', '-hashedPassword -salt')
    .populate('project')
    .exec(function (err,team) {
    if (err) {
      // return errorsHelper.validationErrors(res, err);
      return res.send(500,err);
    }
    return res.json(team);
  })
};

/**
 * create a new team
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */
exports.create = function (req, res) {
  var user = req.user;
  TeamValidator.validateCreate(req, function (err, data) {
    if (err) {
      return errorsHelper.validationErrors(res, err, 'Validation');
    }
    var team = new Team(data);
    team.leader.push(user);
    team.fileTags = ["invoice", "quote", "drawing"];
    team.documentTags = ["architectural", "structural engineering", "hydraulic engineering", "council", "certifier"];
    var listEmail = [];
    async.each(data.emails, function(email, callback) {
      User.findOne({'email': email.email}, function (err, user) {
        if (err) {return res.send(500, err);}
        if (!user) {
          listEmail.push({
            email : email.email,
            status : 'Pending'
          });
        }
        else {
          listEmail.push({
            _id: user._id,
            status : 'Pending'
          });
        }
        callback();
      });
    }, function(err) {
      if (err) {console.log(err);}
      else {
        team.member = listEmail;
        team._user = user;
        team.save(function(err){
          if (err) {
            return errorsHelper.validationErrors(res, err);
          }
          ValidateInvite.findOne({'email': req.user.email}, function(err, validateInvite) {
            if (err) {return res.send(500,err);}
            else if (validateInvite) {
              validateInvite.remove();
            }
          });
          req.user.team = {
            _id:team._id,
            role:'admin'
          };
          req.user.save(function (err) {
            if (err) {
              return errorsHelper.validationErrors(res, err);
            }
            Team.populate(team, [{path:"leader"},{path:"member._id"}], function(err, team ) {
              return res.json(team);
            });

          });
        });
      }
    });
  });
};

/**
 * Add Member
 * @param req
 * @param res
 */
exports.addMember = function(req,res) {
  var team = req.team;
  var emails = req.body;
  var user = req.user;
  async.each(emails, function(email, callback) {
    User.findOne({'email': email.email}, function (err, user) {
      if (err) {
        return res.send(500, err);
      }
      if (!user && !(_.find(team.member,{email : email.email}))) {
        team.member.push({
          email : email.email,
          status : 'Pending'
        });
      }
      else if (user && !(team.member.id(user._id)) && team.leader.indexOf(user._id) == -1){
        team.member.push({
          _id: user._id,
          status : 'Pending'
        });
      }
      callback();
    });
  },function(err,result) {
    team._user = user;
    team.markModified('member');
    team._modifiedPaths = "member";
    team.save(function(err) {
      if (err) {
        return errorsHelper.validationErrors(res, err);
      }
      Team.populate(team, [{path:"leader"},{path:"member._id"}], function(err, team ) {
        return res.json(team);
      });
    })
  });
};

/**
 * Remove Member
 * @param req
 * @param res
 */
exports.removeMember = function(req,res) {
  var team = req.team;
  var user = req.user;
  var member = req.body;
  async.waterfall([
    function(callback) {
      if (member._id) {
        User.findById(member._id._id, function (err, user) {
          if (err || !user) {
            return res.send(500, err);
          }
          team.member.remove(member._id._id);
          user.set('team', undefined);
          user.markModified('team');
          user.save(function(err) {
            if (err) {
              console.log(err);
            }
            callback();
          });
        })
      } else {
        var index = _.findIndex(team.member, {email: member.email});
        team.member.splice(index, 1);
        callback();
      }
    }
  ],function() {
    team.markModified('member');
    team._evtName = 'Team.MemberRemoved';
    team._user = user;
    team._toUser = member;
    team.save(function() {
      Team.populate(team, [{path:"leader"},{path:"member._id"}], function(err, team ) {
        return res.json(team);
      });
    });
  })


};

/**
 * Get all team invitation for auth user
 * @param req
 * @param res
 */
exports.invitation = function(req,res) {
  var user = req.user;
  Team.find({'member' : {"$elemMatch": { "_id": user._id,  "status": 'Pending' }}})
    .populate('leader')
    .exec(function(err,teams) {
      if (err || !teams) {
        // errorsHelper.validationErrors(res, err);
        return res.send(500,err);
      }
      return res.json(teams);
    })
};

/**
 * Accept invitation
 * @param req
 * @param res
 */
exports.accept = function(req,res) {
  var user = req.user;
  var team = req.team;
  var member = team.member.id(user);
  member.status = 'Active';
  team._user = user;
  team._evtName = 'Team.Accepted';
  team.save(function(err) {
    if (err) {
      errorsHelper.validationErrors(res, err);
    }
    user.team = {
      _id : team._id,
      role : 'member'
    };
    user.save(function(err) {
      Team.populate(team, [{path:"leader"},{path:"member._id"}], function(err, team ) {
        return res.json(team);
      });
    });

  })

};

/**
 * Reject invitation
 * @param req
 * @param res
 */
exports.reject = function(req,res) {
  var user = req.user;
  var team = req.team;
  var member = team.member.id(user);
  member.status = 'Reject';
  team._user = user;
  team._evtName = 'Team.Rejected';
  team.save(function(err) {
    if (err) {
      errorsHelper.validationErrors(res, err);
    }
    return res.json(true);
  })
};

exports.assignLeader = function(req,res) {
  var team = req.team;
  var user = req.user
  var member = team.member.id(req.body._id._id);
  team.member.remove(member);
  team.leader.push(member);
  team._evtName = 'Team.LeaderAssigned';
  team._user = user;
  team._toUser = member;
  team.save(function(err) {
    if (err) {
      return res.send(500,err);
    }
    User.findById(member._id,function(err,user) {
      if (err || !user) {
        return res.send(500,err);
      }
      user.team.role = "admin";
      user.save(function(err) {
        if (err) {
          return res.send(500,err);
        }
        Team.populate(team, [{path:"leader"},{path:"member._id"}], function(err, team ) {
          return res.json(team);
        });
      })
    });
  });
};

exports.leaveTeam = function(req,res) {
  var team = req.team;
  var user = req.user;
  async.parallel([
    function(callback) {
       var member = team.member.id(user._id);
      if (member) {
        team.member.remove(member);
        team._user = user;
        team._evtName = 'Team.Leaved';
        team.save(function(err){
          if (err) {
            callback(err,null);
          }
          Task.update({assignees : user._id},{'$pull' : {'assignees' : user._id}},function(err) {
            if (err) {
              callback(err,null);
            }
            StaffPackage.update({staffs : user._id},{'$pull' : {'staffs' : user._id}},function(err,team) {
              if (err) {
                callback(err,null);
              }
              callback(null,null)
            });
          })
        })
      } else {
        callback(null,null);
      }
    },
    function(callback) {
      var leader = team.leader.indexOf(user._id);
      if (leader != -1) {
        team.leader.remove(user._id);
        team._user = user;
        team._evtName = 'Team.Leaved';
        team.save(function(err){
          if (err) {
            callback(err,null);
          }
          Task.update({assignees : user._id},{'$pull' : {'assignees' : user._id}},function(err) {
            if (err) {
              callback(err,null);
            }
            StaffPackage.update({staffs : user._id},{'$pull' : {'staffs' : user._id}},function(err,team) {
              if (err) {
                callback(err,null);
              }
              callback(null,null)
            });
          })
        })
      } else {
        callback(null,null);
      }
    }
  ],function(err,result) {
    if (err) {
      return errorsHelper.validationErrors(err,res)
    }
    user.set('team', undefined);
    user.markModified('team');
    user.save();
    Team.populate(team, [{path:"leader"},{path:"member._id"}], function(err, team ) {
      return res.json(team);
    });
  })
};

/**
 * show team detail
 */
exports.show = function (req, res) {
  
};

exports.update = function (req, res) {
    var team = req.team;
    TeamValidator.validateUpdate(req,function(err,data) {
        if (err) {
            return errorsHelper.validationErrors(res, err, 'Validation');
        }
        team = _.merge(team,data);
        if (req.body.editType === "editBillingAddress") {
            team.detail.billingAddress.suburb = req.body.detail.billingAddress.suburb;
            team.detail.billingAddress.postCode = req.body.detail.billingAddress.postCode;
        } else if (req.body.editType === "editCompanyDetail") {
            team.name = req.body.name;
            team.detail.companyAddress.address = req.body.detail.companyAddress.address;
            team.detail.companyAddress.suburb = req.body.detail.companyAddress.suburb;
            team.detail.companyAddress.postCode = req.body.detail.companyAddress.postCode;
            team.detail.companyPhoneNumber = req.body.detail.companyPhoneNumber;
            team.detail.licenseNumber = req.body.detail.licenseNumber;
            team.detail.companyABN = req.body.detail.companyABN;
        } else if (req.body.editType === "change-tags") {
            team.fileTags = req.body.fileTags;
            team.documentTags = req.body.documentTags;
        }
        team._user = req.user;
        team.save(function() {
            Team.populate(team, [{path:"leader"},{path:"member._id"}], function(err, team ) {
                return res.json(team);
            });
        });
    })
};

exports.getTeamByUser = function(req, res) {
  Team.findOne({$or: [{'user': req.params.id}, {'groupUser._id': req.params.id}]}, function(err, team){
    if (err) {return res.send(500, err);}
    else {
      return res.json(team);
    }
  });
};
