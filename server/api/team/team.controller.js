'use strict';

var User = require('./../../models/user.model');
var Team = require('./../../models/team.model');
var errorsHelper = require('../../components/helpers/errors');
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
    .populate('member.user')
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
            statue : 'waiting'
          });
        }
        else {
          listEmail.push({
            user: user._id,
            status : 'waiting'
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
          req.user.team = {
            _id:team._id,
            role:'admin'
          };
          req.user.save(function (err) {
            if (err) {
              return errorsHelper.validationErrors(res, err);
            }
            Team.populate(team, [{path:"leader"},{path:"member.user"}], function(err, team ) {
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
  console.log(emails);
  async.each(emails, function(email, callback) {
    User.findOne({'email': email.email}, function (err, user) {
      if (err) {
        return res.send(500, err);
      }
      if (!user) {
        team.member.push({
          email : email.email,
          status : 'waiting'
        });
      }
      else {
        team.member.push({
          user: user._id,
          status : 'waiting'
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
      Team.populate(team, [{path:"leader"},{path:"member.user"}], function(err, team ) {
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
  if (member.user) {
    User.findById(member.user._id, function (err, user) {
      if (err) {
        return res.send(500, err);
      }
      var index =_.findIndex(team.member,{user : member.user});
      team.member.splice(index,1);
      team.save();
      user.set('team', undefined);
      user.save(function() {
        console.log(user);
        return res.json(true);
      });
    })
  } else {
    var index =_.findIndex(team.member,{email : member.email});
    team.member.splice(index,1);
    team.save(function() {
      return res.json(true);
    });
  }
};

/**
 * show team detail
 */
exports.show = function (req, res) {
  
};

exports.update = function (req, res) {
  Team.findById(req.params.id, function(err, team) {
    if (err) {return res.send(500, err);}
    else {
      var listEmail = team.groupUser;
      async.each(req.body.params, function(email, callback) {
        User.findOne({'email': email.email}, function (err, user) {
          if (err) {return res.send(500, err);}
          if (!user) {
            listEmail.push(email);
          }
          else {
            listEmail.push({
              _id: user._id,
              email: user.email
            });
          }
          callback();
        });
      }, function(err) {
        if (err) {return res.send(500, err);}
        else {
          team.groupUser = listEmail;
          team.save(function(err, saved){
            if (err) {return res.send(500, err);}
            else {
              return res.json(200, saved);
            }
          });
        }
      });
    }
  });
};

exports.getTeamByUser = function(req, res) {
  Team.findOne({$or: [{'user': req.params.id}, {'groupUser._id': req.params.id}]}, function(err, team){
    if (err) {return res.send(500, err);}
    else {
      return res.json(team);
    }
  });
};
