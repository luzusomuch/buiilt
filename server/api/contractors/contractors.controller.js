'use strict';

var ContractorPackage = require('./../../models/contractorPackage.model');
var Notification = require('./../../models/notification.model');
var PackageInvite = require('./../../models/packageInvite.model');
var ValidateInvite = require('./../../models/validateInvite.model');
var Team = require('./../../models/team.model');
var User = require('./../../models/user.model');
var _ = require('lodash');
var async = require('async');

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.getAll = function(req, res) {
  ContractorPackage.find({}, function(err, contractorPackages){
    if (err) {return res.send(500,err);}
    return res.send(200, contractorPackages);
  });
};

exports.index = function (req, res) {
  var user = req.user;
  ContractorPackage.find({project : req.params.id},function (err, contractors) {
    if (err){
      return res.send(500, err);
    }
    async.each(contractors,function(item,callback) {
      Notification.find({owner: user._id,'element.package' : item._id, unread : true}).count(function(err,count) {
        item.__v = count;
        callback();
      })
    },function() {
      return res.json(contractors)
    });
  });
};

/**
 * Creates a new contractor package
 */
exports.createContractorPackage = function (req, res, next) {
  var to = [];
  var contractorPackage = new ContractorPackage({
    owner: req.body.team,
    type: 'contractor',
    name: req.body.contractor.name,
    descriptions: req.body.contractor.descriptions,
    project: req.body.project,
    category: req.body.contractor.category,
    dateStart: req.body.contractor.dateStart
  });
  _.each(req.body.contractor.descriptions, function(description){
    contractorPackage.addendums.push({
      'addendumsScope.description': description
    }); 
  });
  async.each(req.body.emailsPhone, function(emailPhone, callback) {
    User.findOne({'email': emailPhone.email}, function(err, user) {
      if (err) {console.log(err);return callback(err);}
      if (!user) {
        to.push({
          email: emailPhone.email,
          phone: emailPhone.phoneNumber
        });
        callback();
      }
      else {
        Team.findOne({$or:[{'leader': user._id}, {'member._id': user._id}]}, function(err, team){
          if (err || !team) {return callback(err);}
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
      contractorPackage.to = to;
      if (req.body.contractor.isSkipInTender == true) {
        contractorPackage.isSkipInTender = req.body.contractor.isSkipInTender;
        var winnerTeam = _.first(to);
        if (winnerTeam._id) {
          contractorPackage.winnerTeam._id = winnerTeam._id;
          contractorPackage.isAccept = true;
        }
      }
      contractorPackage._ownerUser = req.user;
      contractorPackage.save(function(err, saved){
        if (err) {return res.send(500,err);}
        else {
          return res.json(200,saved);
        }
      });
    }
  });
};

exports.getProjectForContractor = function(req, res) {
  Team.findOne({$or:[{'leader': req.params.id}, {'member._id': req.params.id}]}, function(err, team) {
    if (err) {return res.send(500,err);}
    if (!team) {return res.send(404,err);}
    else {
      ContractorPackage.find({$or:[{'to._id': team._id},{'to.email': req.user.email}]}).populate('project').exec(function(err, contractorPackage){
        if (err) {return res.send(500,err);}
        else {
          return res.json(200, contractorPackage);
        }
      });
    }
  });
};

exports.getContractorPackageByProjectForContractor = function(req, res) {
  Team.findOne({$or: [{'leader': req.user._id}, {'member._id': req.user._id}]}, function(err, team) {
    if (err) {return res.send(500, err);}
    if (!team) {return res.send(404,err);}
    else {
      ContractorPackage.find({'project': req.params.id, 'to._id' : team._id, 'isCancel': false}, function(err, contractors){
        if (err) {return res.send(500, err);}
        else {
          return res.json(200, contractors);
        }
      });
    }
  });
  
};

exports.getContractorPackageByProjectForBuilder = function(req, res) {
  ContractorPackage.find({$and:[{'project': req.params.id}, {isCancel: false}]}, function(err, contractors){
    if (err) {return res.send(500, err);}
    else {
      return res.json(200, contractors);
    }
  })
};

exports.getContractorPackageTenderByProjectForBuilder = function(req, res) {
  ContractorPackage.find({$and:[{'project' : req.params.id},{status: true}, {isCancel: false}]}, function(err, contractors) {
    if (err) {return res.send(500, err);}
    if (!contractors) {return res.send(404, err);}
    else {
      return res.json(200, contractors);
    }
  });
};

exports.getContractorPackageInProcessByProjectForBuilder = function(req, res) {
  ContractorPackage.find({$and:[{'project' : req.params.id},{status: false}, {isCancel: false}]}, function(err, contractors) {
    if (err) {return res.send(500, err);}
    if (!contractors) {return res.send(404, err);}
    else {
      return res.json(200, contractors);
    }
  });
};

exports.getContractorPackageTenderByProjectForContractor = function(req, res) {
  Team.findOne({$or: [{'leader': req.user._id}, {'member._id': req.user._id}]}, function(err, team) {
    if (err) {return res.send(500, err);}
    if (!team) {return res.send(404,err);}
    else {
      ContractorPackage.find({$and:[{'project' : req.params.id},{'to._id': team._id},{status: true}, {isCancel: false}]}, function(err, contractor){
        if (err) {return res.send(500,err);}
        else {
          return res.json(200,contractor)
        }
      });
    }
  });
};

exports.getContractorPackageInProcessByProjectForContractor = function(req, res) {
  Team.findOne({$or: [{'leader': req.user._id}, {'member._id': req.user._id}]}, function(err, team) {
    if (err) {return res.send(500, err)}
    if (!team) {return res.send(404,err)}
    else {
      ContractorPackage.find({$and:[{'project' : req.params.id}, {'winnerTeam._id': team._id},{status: false}, {isCancel: false}]}, function(err, contractors) {
        if (err) {return res.send(500, err);}
        if (!contractors) {return res.send(404, err);}
        else {
          return res.json(200, contractors);
        }
      });
    }
  });
};

exports.destroy = function (req, res) {
  ContractorPackage.findByIdAndRemove(req.params.id, function (err, contractorPackage) {
    if (err) {
      return res.send(500, err);
    }
    if (!contractorPackage) {return res.send(404);}
    console.log(contractorPackage);
    ContractorPackage.find({}, function(err,packages){
      if (err) {return res.send(500,err);}
      return res.send(200, packages);
    })
  });
};
