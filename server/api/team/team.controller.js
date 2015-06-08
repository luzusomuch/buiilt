'use strict';

var User = require('./../../models/user.model');
var Team = require('./../../models/team.model');
var errorsHelper = require('../../components/helpers/errors');
var TeamValidator = require('./../../validators/team');
var _ = require('lodash');
var async = require('async');

exports.index = function (req, res) {
  var teamIds = [];
  if (!req.user.teams.length) {
    return res.json([]);
  }
  _.each(req.user.teams, function (team) {
    teamIds.push(team._id);
  });
  Team.find({'_id': {$in: teamIds}}, function (err, teams) {
    if (err) {
      return errorsHelper.validationErrors(res, err);
    }
    res.json(teams);
  });
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
    team.user = req.user;
    var listEmail = [];
    async.each(data.emails, function(email, callback) {
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
      if (err) {console.log(err);}
      else {
        team.groupUser = listEmail;
        team.save(function(err){
          if (err) {
            return errorsHelper.validationErrors(res, err);
          }
          req.user.teams.push({_id:team._id,role:'admin'});
          req.user.save(function (err) {
            if (err) {
              return errorsHelper.validationErrors(res, err);
            }
            return res.json(team);
          });
        });
      }
    });
  });
};

/**
 * show team detail
 */
exports.show = function (req, res) {
  
};

exports.update = function (req, res) {
  console.log('asdasdsad');
  console.log(req.params.id);
};

exports.getTeamByUser = function(req, res) {
  Team.findOne({$or: [{'user': req.params.id}, {'groupUser._id': req.params.id}]}, function(err, team){
    if (err) {return res.send(500, err);}
    else {
      return res.json(team);
    }
  });
};