'use strict';

var ContractorPackage = require('./../../models/contractorPackage.model');
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
  ContractorPackage.find(function (err, contractors) {
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
    owner: req.user._id,
    name: req.body.contractor.name,
    description: req.body.contractor.description,
    project: req.body.project
  });
  async.each(req.body.emailsPhone, function(emailPhone, callback) {
    User.findOne({'email': emailPhone.email}, function(err, user) {
      if (err) {return res.send(500,err);}
      if (!user) {
        var validateInvite = new ValidateInvite({
          email: emailPhone.email,
          inviteType: 'contractor'
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
      contractorPackage.to = to;
      contractorPackage.save(function(err, saved){
        if (err) {return res.send(500,err);}
        else {
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

exports.getProjectForContractorWhoWinner = function(req, res) {
  Team.findOne({$or:[{'leader': req.params.id}, {'member._id': req.params.id}]}, function(err, team) {
    if (err) {return res.send(500,err);}
    if (!team) {return res.send(404,err);}
    else {
      ContractorPackage.find({'winnerTeam._id': team._id}).populate('project').exec(function(err, contractors) {
        if (err) {return res.send(500, err);}
        if (!contractors) {return res.send(404,err);}
        else {
          return res.json(200, contractors);
        }
      });
    }
  });
  // ContractorPackage.find({'winner._id': req.params.id}).populate('project').exec(function(err, result){
  //   if (err) {res.send(500, err);}
  //   else {
  //     return res.json(200, result);
  //   }
  // });
};

exports.getContractorByProjectForBuilder = function(req, res) {
  ContractorPackage.find({'project': req.params.id}, function(err, contractors){
    if (err) {return res.send(500, err);}
    else {
      return res.json(200, contractors);
    }
  })
};

exports.getContractorPackageTenderByProjectForBuilder = function(req, res) {
  ContractorPackage.find({$and:[{'project' : req.params.id},{status: true}]}, function(err, contractors) {
    if (err) {return res.send(500, err);}
    if (!contractors) {return res.send(404, err);}
    else {
      return res.json(200, contractors);
    }
  });
};

exports.getContractorPackageInProcessByProjectForBuilder = function(req, res) {
  ContractorPackage.find({$and:[{'project' : req.params.id},{status: false}]}, function(err, contractors) {
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
      var teamMemberId = team.leader;
      async.each(team.member, function(member, callback) {
        if (member._id) {
          teamMemberId.push(member._id);
        }
        callback();
      }, function(err) {
        if (err) {return res.send(500,err)}
        else {
          var contractors = [];
          async.each(teamMemberId, function(id, callback) {
            ContractorPackage.findOne({$and:[{'project' : req.params.id},{'to._id': id},{status: true}]}, function(err, contractor){
              if (err) {return res.send(500,err);}
              if (!contractor) {return res.send(404,err);}
              else {
                contractors.push(contractor);
              }
            });
            callback();
          }, function(err) {
            if (err) {return res.send(500, err)}
            else {
              return res.send(200, contractors);
            }
          });
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
      ContractorPackage.find({$and:[{'project' : req.params.id}, {'winnerTeam._id': team._id},{status: false}]}, function(err, contractors) {
        if (err) {return res.send(500, err);}
        if (!contractors) {return res.send(404, err);}
        else {
          return res.json(200, contractors);
        }
      });
    }
  });
};
