'use strict';

var User = require('./../../models/user.model');
var Team = require('./../../models/team.model');
var Project = require('./../../models/project.model');
var ValidateInvite = require('./../../models/validateInvite.model');
var errorsHelper = require('../../components/helpers/errors');
var _ = require('lodash');
var async = require('async');

exports.getByUser = function(req, res) {
    ValidateInvite.findOne({'email': req.user.email}, function(err, validateInvite) {
        if (err) {return res.send(500, err);}
        if (!validateInvite) {return res.send(404,err);}
        else {
            return res.json(validateInvite);
        }
    });
};