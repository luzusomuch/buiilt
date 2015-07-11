  'use strict';

var MaterialPackage = require('./../../models/materialPackage.model');
var PackageInvite = require('./../../models/packageInvite.model');
var Notification = require('./../../models/notification.model');
var ValidateInvite = require('./../../models/validateInvite.model');
var User = require('./../../models/user.model');
var Team = require('./../../models/team.model');
var _ = require('lodash');
var async = require('async');

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function (req, res) {
  var user = req.user;
  MaterialPackage.find({project : req.params.id},function (err, materials) {
    if (err){
      return res.send(500, err);
    }
    async.each(materials,function(item,callback) {
      Notification.find({owner: user._id,'element.package' : item._id, unread : true}).count(function(err,count) {
        item.__v = count;
        callback();
      })
    },function() {
      return res.json(materials)
    });
  });
};

/**
 * Creates a new contractor package
 */
exports.createMaterialPackage = function (req, res, next) {
  var to = [];
  var materialPackage = new MaterialPackage({
    owner: req.user.team._id,
    type: 'material',
    name: req.body.material.name,
    descriptions : req.body.material.descriptions,
    dateStart: req.body.material.dateStart,
    project: req.body.project,
    requirements: req.body.requirements
  });
  _.each(req.body.requirements, function(requirement){
    materialPackage.addendums.push({
      description: '',
      'addendumsScope.description': requirement.description,
      'addendumsScope.quantity': requirement.quantity,
    });  
  });
  async.each(req.body.suppliers, function(emailPhone, callback) {
    User.findOne({'email': emailPhone.email}, function(err, user) {
      if (err) {return callback(err);}
      if (!user) {
        to.push({
          email: emailPhone.email,
          phone: emailPhone.phoneNumber
        });
        callback();
      }
      else {
        Team.findOne({$or:[{'leader': user._id}, {'member._id': user._id}]}, function(err, team){
          if (err) {return callback(err);}
          else {
            team.project.push(req.body.project);
            team.save();
            to.push({
              _id: team._id,
              email: emailPhone.email,
              phone: emailPhone.phoneNumber
            });
            callback();
          }
        });
      }
    });
  }, function(err) {
    if (err) {return res.send(500,err);}
    else {
      materialPackage.to = to;
      materialPackage._ownerUser = req.user;
      materialPackage.save(function(err, saved){
        if (err) {return res.send(500,err);}
        else {
          return res.json(200,saved);
        }
      });
    }
  });
};

exports.getProjectForSupplier = function(req, res) {
  Team.findOne({$or:[{'leader': req.params.id}, {'member._id': req.params.id}]}, function(err, team) {
    if (err) {return res.send(500,err);}
    if (!team) {return res.send(404,err);}
    else {
      MaterialPackage.find({'to._id': team._id}).populate('project').exec(function(err, materialPackage){
        if (err) {return res.send(500,err);}
        else {
          return res.json(200, materialPackage);
        }
      });
    }
  });
};

exports.getMaterialPackageTenderByProjectForBuilder = function(req, res) {
  MaterialPackage.find({$and:[{'project' : req.params.id},{status: true}, {isCancel: false}]}, function(err, materialPackages) {
    if (err) {return res.send(500, err);}
    if (!materialPackages) {return res.send(404, err);}
    else {
      return res.json(200, materialPackages);
    }
  });
};

exports.getMaterialPackageInProcessByProjectForBuilder = function(req, res) {
  MaterialPackage.find({$and:[{'project' : req.params.id},{status: false}, {isCancel: false}]}, function(err, materialPackages) {
    if (err) {return res.send(500, err);}
    if (!materialPackages) {return res.send(404, err);}
    else {
      return res.json(200, materialPackages);
    }
  });
};

exports.getMaterialPackageInTenderByProjectForSupplier = function(req, res) {
  Team.findOne({$or: [{'leader': req.user._id}, {'member._id': req.user._id}]}, function(err, team) {
    if (err) {return res.send(500, err);}
    if (!team) {return res.send(404,err);}
    else {
      MaterialPackage.find({$and:[{'project' : req.params.id},{'to._id': team._id},{status: true}, {isCancel: false}]}, function(err, materialPackages){
        if (err) {return res.send(500,err);}
        else {
          return res.json(200, materialPackages)
        }
      });
    }
  });
};

exports.getMaterialPackageInProcessByProjectForSupplier = function(req, res) {
  Team.findOne({$or: [{'leader': req.user._id}, {'member._id': req.user._id}]}, function(err, team) {
    if (err) {return res.send(500, err)}
    if (!team) {return res.send(404,err)}
    else {
      MaterialPackage.find({$and:[{'project' : req.params.id}, {'winnerTeam._id': team._id},{status: false}, {isCancel: false}]}, function(err, materialPackages) {
        if (err) {return res.send(500, err);}
        if (!materialPackages) {return res.send(404, err);}
        else {
          return res.json(200, materialPackages);
        }
      });
    }
  });
};

exports.getMaterialByProjectForBuilder = function(req, res) {
  MaterialPackage.find({'project': req.params.id}, function(err, materialPackages){
    if (err) {return res.send(500, err);}
    else {
      return res.json(200, materialPackages);
    }
  })
};

exports.getMaterialByProjectForSupplier = function(req, res) {
  Team.findOne({$or: [{'leader': req.user._id}, {'member._id': req.user._id}]}, function(err, team) {
    if (err) {return res.send(500, err);}
    if (!team) {return res.send(404,err);}
    else {
      MaterialPackage.find({'project': req.params.id, 'to._id' : team._id}, function(err, materialPackages){
        if (err) {return res.send(500, err);}
        else {
          return res.json(200, materialPackages);
        }
      });
    }
  });
  
};