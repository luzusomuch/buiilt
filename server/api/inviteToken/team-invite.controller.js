'use strict';

var User = require('./../../models/user.model');
var InviteToken = require('./../../models/inviteToken.model');
var errorsHelper = require('../../components/helpers/errors');
var Project = require('./../../models/project.model');
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

exports.getProjectInvitation = function(req, res) {
    InviteToken.find({type: 'project-invite', user: req.user._id})
    .exec(function(err, invites) {
        if (err) {return res.send(500,err);}
        var result = [];
        async.each(invites, function(invite, cb) {
            Project.findById(invite.element.project, function(err, project) {
                if (err || !project) {cb();}
                else {
                    invite.element.project = project;
                    result.push(invite);
                    cb();
                }
            });
        }, function() {
            return res.send(200,result);
        });
    });
};