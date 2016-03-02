'use strict';

var PackageInvite = require('./../../models/packageInvite.model');
var ValidateInvite = require('./../../models/validateInvite.model');
var User = require('./../../models/user.model');
var _ = require('lodash');
var async = require('async');

exports.getByPackageInviteToken = function(req, res) {
    PackageInvite.findById(req.params.id)
    .populate('owner', '-hashedPassword -salt')
    .exec(function(err, packageInvite){
        if (err) {return res.send(500,err);}
        else {
            return res.json(200,packageInvite);
        }
    });
};