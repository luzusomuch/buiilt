'use strict';

var User = require('./../../models/user.model');
var TeamInvite = require('./../../models/teamInvite.model');
var errorsHelper = require('../../components/helpers/errors');
var _ = require('lodash');
var async = require('async');

exports.get = function(req,res) {
  console.log("asdasdasdas");
  TeamInvite
    .findOne({teamInviteToken : req.params.token})
    .populate('team')
    .exec(function(err,invite) {
      if (err || !invite) {
        return res.send(500,err)
      }
      return res.json(invite);
    })

};