'use strict';

var ContractorPackage = require('./../../models/contractorPackage.model');
var User = require('./../../models/user.model');
var _ = require('lodash');

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function (req, res) {
  ContractorPackage.find(function (err, contractors) {
    if (err){
      return res.send(500, err);
    }    
    res.json(200, {contractors : contractors});
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
    project: req.body.contractor.project
  });
  _.each(req.body.emailsPhone, function(emailPhone){
    User.findOne({'email': emailPhone.email}, function(err, user) {
      if (err) {return res.send(500,err);}
      else {
        emailPhone._id = user._id
        to.push(emailPhone);
        contractorPackage.to = to;
        contractorPackage.save(function(err, saved) {
          if (err) {return res.send(500,err);}
          else {
            return res.json(200,saved);
          }
        })
      }
    });
  });

  // contractorPackage.save(function(err, saved) {
  //   if (err) {return res.send(500, err);}
  //   else {
  //       return res.json(200, saved);
  //   }
  // });
};
