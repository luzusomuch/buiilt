'use strict';

var User = require('./../../models/user.model');
var InviteToken = require('./../../models/inviteToken.model');
var errorsHelper = require('../../components/helpers/errors');
var _ = require('lodash');
var async = require('async');

exports.get = function(req,res) {
  InviteToken
    .findOne({inviteToken : req.params.token})
    .exec(function(err,invite) {
      if (err || !invite) {
        return res.send(500,err)
      }
      return res.json(invite);
    })

};