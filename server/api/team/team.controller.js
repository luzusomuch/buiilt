'use strict';

var User = require('./../../models/user.model');
var Team = require('./../../models/team.model');
var Task = require('./../../models/task.model');
var StaffPackage = require('./../../models/staffPackage.model');
var errorsHelper = require('../../components/helpers/errors');
var ValidateInvite = require('./../../models/validateInvite.model');
var TeamValidator = require('./../../validators/team');
var _ = require('lodash');
var async = require('async');

exports.team = function (req,res,next) {
  Team.findById(req.params.id,function(err,team) {
    if (err || !team) {
      return errorsHelper.validationErrors(res, "Team not found")
    }
    req.team = team;

    next();
  })
};

exports.index = function (req, res) {
  if (!req.user.team) {
    return res.json([]);
  }
  Team.findById(req.user.team._id, function (err, team) {
    if (err) {
      return errorsHelper.validationErrors(res, err);
    }
    res.json(team);

  });
};

exports.me = function(req,res) {
  var user = req.user;
  if (!user.team) {
    // return res.json(null);
    return res.send(500);
  }
  Team.findById(user.team._id)
    .populate('leader')
    .populate('member._id')
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
    team.markModified('member');
    team._user = user;
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

exports.getHomeOwnerTeam = function(req, res) {
  Team.find({'type': 'homeOwner'}).exec(function(err, teams) {
    if (err) {return res.send(500,err);}
    else {
      Team.populate(teams, [{path: 'leader'}, {path: 'member._id'}], function(err, team) {
        return res.json(200,team);  
      });
    }
  });
};

exports.getHomeBuilderTeam = function(req, res) {
  Team.find({'type': 'buider'}).populate('leader').populate('member._id').exec(function(err, teams) {
    if (err) {return res.send(500,err);}
    else {
      return res.json(200,teams);
    }
  });
};

exports.getContractorTeam = function(req, res) {
  Team.find({'type': 'contractor'}).populate('leader').populate('member._id').exec(function(err, teams) {
    if (err) {return res.send(500,err);}
    else {
      return res.json(200,teams);
    }
  });
};

exports.getSupplierTeam = function(req, res) {
  Team.find({'type': 'supplier'}).populate('leader').populate('member._id').exec(function(err, teams) {
    if (err) {return res.send(500,err);}
    else {
      return res.json(200,teams);
    }
  });
};
