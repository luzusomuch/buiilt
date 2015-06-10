'use strict';

var User = require('./../../models/user.model');
var QuoteRequest = require('./../../models/quoteRequest.model');
var ContractorPackage = require('./../../models/contractorPackage.model');
var errorsHelper = require('../../components/helpers/errors');
var UserValidator = require('./../../validators/user');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var okay = require('okay');
var _ = require('lodash');
var async = require('async');

exports.createUserForContractorRequest = function(req, res, next) {
  UserValidator.validateNewUser(req, okay(next, function (data) {
    var newUser = new User(data);
    newUser.provider = 'local';
    newUser.role = 'user';
    newUser.save(function (err, user) {
      if (err) {
        return res.send(res, err);
      }
      var quoteRequest = new QuoteRequest({
        user: user._id,
        email: data.email,
        description: data.quoteRequest.description,
        // project: data.contractorRequest.project._id,
        type: 'contractor to builder',
        package: data.idParams,
        packageType: 'contractor',
        price: data.quoteRequest.price
      });
      ContractorPackage.findOne({'_id': data.idParams}, function(err, contractorPackage) {
        if (err) {return res.send(500, err);}
        else {
            quoteRequest.project = contractorPackage.project;
            quoteRequest.save(function(err, saved) {
                if (err) {return res.send(500, err);}
                else {
                    return res.json(saved);
                }
            });
        }
      });
      var token = jwt.sign({_id: user._id}, config.secrets.session, {expiresInMinutes: 60 * 5});
      res.json({token: token});
    });
  }));
};