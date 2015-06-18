'use strict';

var User = require('./../../models/user.model');
var Team = require('./../../models/team.model');
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
    return res.json(null);
  }
  Team.findById(user.team._id)
    .populate('leader')
    .populate('member._id')
    .exec(function (err,team) {
    if (err) {
      return errorsHelper.validationErrors(res, err);
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
  TeamValidator.validateCreate(req, function (err, data) {
    if (err) {
      return errorsHelper.validationErrors(res, err, 'Validation');
    }
    var team = new Team(data);
    team.leader.push(req.user);
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
  var member = req.body;
  console.log(member._id);
  if (member._id) {
    User.findById(member._id._id, function (err, user) {
      if (err) {
        return res.send(500, err);
      }
      var index =_.findIndex(team.member,{user : member._id._id});
      team.member.splice(index,1);
      team.save();
      user.set('team', undefined);
      user.markModified('team');
      user.save(function(err) {
        if (err)
          console.log(err);
      });
    })
  } else {
    var index = _.findIndex(team.member, {email: member.email});
    team.member.splice(index, 1);
  }
  team.save(function() {
    Team.populate(team, [{path:"leader"},{path:"member._id"}], function(err, team ) {
      return res.json(team);
    });
  });
};

/**
 * Get all team invitation for auth user
 * @param req
 * @param res
 */
exports.invitation = function(req,res) {
  var user = req.user;
  Team.find({'member._id' : user._id, 'member.status' : 'Pending'})
    .populate('leader')
    .exec(function(err,teams) {
      if (err || !teams) {
        errorsHelper.validationErrors(res, err);
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
  team.save(function(err) {
    if (err) {
      errorsHelper.validationErrors(res, err);
    }
    return res.json(true);
  })
};

exports.assignLeader = function(req,res) {
  var team = req.team;
  var members = req.body;
  async.each(members,function(member,callback) {
    var _member = team.member.id(member);
    team.member.remove(_member);
    team.leader.push(_member);
    team.save(function(err) {
      if (err) {
        callback(err,null);
      }
      User.findById(member,function(err,user) {
        user.team.role = "admin";
        user.save(function(err) {
          if (err) {
            callback(err,null);
          }
          callback(null,null)
        })
      });
    })
  },function(err, result) {
    if (err) {
      return errorsHelper.validationErrors(err,res)
    }
    Team.populate(team, [{path:"leader"},{path:"member._id"}], function(err, team ) {
      return res.json(team);
    });
  });
};

exports.leaveTeam = function(req,res) {
  var team = req.team;
  var user = req.user;
  async.parallel([
    function(callback) {
       var member = team.member.id(user._id);
      console.log(member);
      if (member) {
        team.member.remove(member);
        team.save(function(err){
          if (err) {
            callback(err,null);
          }
          callback(null,null)
        })
      } else {
        callback(null,null);
      }
    },
    function(callback) {
      var leader = team.leader.indexOf(user._id);
      if (leader != -1) {
        team.leader.remove(user._id);
        team.save(function(err){
          if (err) {
            callback(err,null);
          }
          callback(null,null);
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
  Team.find({'type': 'homeOwner'}).populate('user').exec(function(err, teams) {
    if (err) {return res.send(500,err);}
    else {
      return res.json(200,teams);
    }
  });
};
