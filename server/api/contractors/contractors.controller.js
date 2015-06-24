'use strict';

var ContractorPackage = require('./../../models/contractorPackage.model');
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
exports.index = function (req, res) {
  ContractorPackage.find({project : req.params.id},function (err, contractors) {
    if (err){
      return res.send(500, err);
    }    
    res.json(200, contractors);
  });
};

/**
 * Creates a new contractor package
 */
exports.createContractorPackage = function (req, res, next) {
  var to = [];
  var contractorPackage = new ContractorPackage({
    owner: req.body.team,
    packageType: 'contractor',
    name: req.body.contractor.name,
    description: req.body.contractor.description,
    project: req.body.project,
    category: req.body.contractor.category,
    dateStart: req.body.contractor.dateStart
  });
  async.each(req.body.emailsPhone, function(emailPhone, callback) {
    User.findOne({'email': emailPhone.email}, function(err, user) {
      if (err) {return res.send(500,err);}
      if (!user) {
        // var validateInvite = new ValidateInvite({
        //   email: emailPhone.email,
        //   inviteType: 'contractor'
        // });
        // validateInvite.save();
        
        to.push({
          email: emailPhone.email,
          phone: emailPhone.phoneNumber
        });
        callback();
      }
      else {
        Team.findOne({$or:[{'leader': user._id}, {'member._id': user._id}]}, function(err, team){
          if (err) {return res.send(500, err);}
          else {
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
      contractorPackage.save(function(err, saved){
        if (err) {return res.send(500,err);}
        else {
          _.each(req.body.emailsPhone, function(emailPhone){
            User.findOne({email: emailPhone.email}, function(err, user){
              if (err) {return res.send(500,err);}
              if (!user) {
                var packageInvite = new PackageInvite({
                  owner: req.user._id,
                  inviteType: 'contractor',
                  project: req.body.project,
                  package: saved._id,
                  to: emailPhone.email
                });
                packageInvite.save();
              }
            })
          });
          return res.json(200,saved);
        }
      });
    }
  });
  // _.each(req.body.emailsPhone, function(emailPhone){
  //   User.findOne({'email': emailPhone.email}, function(err, user) {
  //     if (err) {return res.send(500,err);}
  //     else {
  //       emailPhone._id = user._id
  //       to.push(emailPhone);
  //       contractorPackage.to = to;
  //       contractorPackage.save(function(err, saved) {
  //         if (err) {return res.send(500,err);}
  //         else {
  //           return res.json(200,saved);
  //         }
  //       })
  //     }
  //   });
  // });
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
