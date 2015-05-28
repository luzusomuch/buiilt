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
    team.save(function (err) {
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
  });
};

/**
 * show team detail
 */
exports.show = function (req, res) {
  
};

exports.update = function (req, res) {
  
};