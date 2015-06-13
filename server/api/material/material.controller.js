'use strict';

var MaterialPackage = require('./../../models/materialPackage');
var ValidateInvite = require('./../../models/validateInvite.model');
var User = require('./../../models/user.model');
var _ = require('lodash');
var async = require('async');

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function (req, res) {
  MaterialPackage.find(function (err, contractors) {
    if (err){
      return res.send(500, err);
    }    
    res.json(200, contractors);
  });
};

/**
 * Creates a new contractor package
 */
exports.createMaterialPackage = function (req, res, next) {
  var to = [];
  var materialPackage = new MaterialPackage({
    owner: req.user._id,
    name: req.body.material.name,
    // description: req.body.contractor.description,
    project: req.body.project,
    requirements: req.body.requirements
  });
  async.each(req.body.suppliers, function(emailPhone, callback) {
    User.findOne({'email': emailPhone.email}, function(err, user) {
      if (err) {return res.send(500,err);}
      if (!user) {
        var validateInvite = new ValidateInvite({
          email: emailPhone.email,
          inviteType: 'supplier'
        });
        validateInvite.save();
        to.push({
          email: emailPhone.email,
          phone: emailPhone.phoneNumber
        });
        callback();
      }
      else {
        to.push({
          _id: user._id,
          email: emailPhone.email,
          phone: emailPhone.phoneNumber
        });
        callback();
      }
    });
  }, function(err) {
    if (err) {return res.send(500,err);}
    else {
      materialPackage.to = to;
      materialPackage.save(function(err, saved){
        if (err) {return res.send(500,err);}
        else {
          return res.json(200,saved);
        }
      });
    }
  });
};

exports.getMaterialPackageTenderByProject = function(req, res) {
  MaterialPackage.find({$and:[{'project' : req.params.id},{status: true}]}, function(err, materialPackages) {
    if (err) {return res.send(500, err);}
    if (!materialPackages) {return res.send(404, err);}
    else {
      return res.json(200, materialPackages);
    }
  });
};

exports.getMaterialPackageInProcessByProject = function(req, res) {
  MaterialPackage.find({$and:[{'project' : req.params.id},{status: false}]}, function(err, materialPackages) {
    if (err) {return res.send(500, err);}
    if (!materialPackages) {return res.send(404, err);}
    else {
      return res.json(200, materialPackages);
    }
  });
};

