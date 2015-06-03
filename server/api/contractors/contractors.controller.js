'use strict';

var ContractorPackage = require('./../../models/contractorPackage.model');

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
    console.log(req.body);
  var contractorPackage = new ContractorPackage({
    owner: req.body.user,
    name: req.body.name,
    description: req.body.description,
    project: req.body.project
  });
  contractorPackage.save(function(err, saved) {
    if (err) {return res.send(500, err);}
    else {
        return res.json(200, saved);
    }
  });
};
