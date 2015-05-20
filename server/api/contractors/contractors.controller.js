'use strict';

var contractorPackage = require('./../../models/contractorPackage.model');

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function (req, res) {
  contractorPackage.find(function (err, contractors) {
    if (err){
      return res.send(500, err);
    }    
    res.json(200, {contractors : contractors});
  });
};

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
  return true;
};
