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
    project: req.body.project,
    category: req.body.contractor.category,
    dateStart: req.body.contractor.dateStart
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
      var contractors = [];
      var memberId = team.leader;
      async.each(team.member, function(member, callback) {
        if (member._id) {
          memberId.push(member._id);
        }
        callback();
      }, function(err) {
        if (err) {console.log(err);}
        else {
          ContractorPackage.find({}, function(err, contractorPackageList) {
            if (err) {return res.send(500,err);}
            else {
              async.each(memberId, function(member, callback) {
                _.each(contractorPackageList, function(contractorPackage) {
                  ContractorPackage.findOne({'_id':contractorPackage._id, 'to._id': member}).populate('project').exec(function(err, contractorPackage){
                    if (err) {return res.send(500,err);}
                    // if (!contractorPackage) {console.log('sdsdsd');}
                    else {
                      if (contractorPackage !== null) {
                        contractors.push(contractorPackage);
                        // callback();
                      }
                    }
                  });
                });
                callback();
              }, function(err) {
                if (err) {return res.send(500,err);}
                else {
                  console.log(contractors);
                  return res.json(200,contractors);
                }
              });
            }
          });
        }
      });
      // return;
      // ContractorPackage.find({'winnerTeam._id': team._id}).populate('project').exec(function(err, contractors) {
      //   if (err) {return res.send(500, err);}
      //   if (!contractors) {return res.send(404,err);}
      //   else {
      //     return res.json(200, contractors);
      //   }
      // });
    }
  });
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
      var contractors;
      var teamMemberId = team.leader;
      async.each(team.member, function(member, callback) {
        if (member._id) {
          teamMemberId.push(member._id);
        }
        callback();
      }, function(err) {
        if (err) {return res.send(500,err)}
        else {
          async.each(teamMemberId, function(id, callback) {
            ContractorPackage.find({$and:[{'project' : req.params.id},{'to._id': id},{status: true}]}, function(err, contractor){
              if (err) {return res.send(500,err);}
              if (!contractor) {callback();}
              else {
                if (contractor !== null) {
                  contractors = contractor;  
                  callback();  
                }
              }
            });
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
