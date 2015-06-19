'use strict';

var ContractorPackage = require('./../../models/contractorPackage.model');
var ValidateInvite = require('./../../models/validateInvite.model');
var QuoteRequest = require('./../../models/quoteRequest.model');
var User = require('./../../models/user.model');
var _ = require('lodash');
var async = require('async');

exports.findOne = function(req, res) {
    ContractorPackage.findById(req.params.id).populate('project').exec(function(err, contractorPackage) {
        if (err) {return res.send(500, err);}
        else {
            return res.json(contractorPackage);
        }
    });
};

exports.sendMessage = function(req, res) {
  ContractorPackage.findById(req.params.id, function(err, contractorPackage) {
    if (err) {return res.send(500,err)}
    if (!contractorPackage) {return res.send(404,err)}
    else {
      contractorPackage.messages.push({
        owner: req.user._id,
        message: req.body.message
      });
      contractorPackage.save(function(err, saved) {
        if (err) {return res.send(500, err)}
        else {
          return res.json(200,saved);
        }
      });
    }
  });
};

exports.getMessageForContractor = function(req, res) {
  ContractorPackage.findOne({$and:[{_id: req.params.id},{'messages.owner': req.user._id}]}, function(err, contractorPackage) {
    if (err) {console.log(err);}
    if (!contractorPackage) {return res.send(404,err)}
    else {
      return res.json(200,contractorPackage);
    }
  });
};

exports.sendQuote =function(req, res) {
  
  var quoteRequest = new QuoteRequest({
    user: req.user._id,
    description: req.body.quoteRequest.description,
    project: req.body.contractorRequest.project._id,
    type: 'contractor to builder',
    package: req.body.contractorRequest._id,
    packageType: 'contractor',
    price: req.body.quoteRequest.price
  });
  var quoteRate = [];
  var quotePrice = [];
  var subTotal = 0;
  async.each(req.body.rate, function(rate, callback){
    if (rate !== null) {
      for (var i = 0; i < req.body.rate.length -1; i++) {
        quoteRate.push({
          description: rate.description[i],
          rate: rate.rate[i],
          quantity: rate.quantity[i],
          total: rate.rate[i] * rate.quantity[i]
        });
        subTotal += rate.rate[i] * rate.quantity[i];
      };
    }
    callback();
  }, function(err) {
    if (err) {return res.send(500,err);}
    else {
      quoteRequest.quoteRate = quoteRate;
      async.each(req.body.price, function(price, callback){
        if (price !== null) {
          for (var i = 0; i < req.body.price.length -1; i++) {
            quotePrice.push({
              description: price.description[i],
              price: price.price[i],
              quantity: 1,
              total: price.price[i]
            });
            subTotal += price.price[i] * 1;
          };
        }
        callback();
      }, function(err){
        if (err) {return res.send(500,err);}
        else {
          quoteRequest.quotePrice = quotePrice;
          quoteRequest.subTotal = subTotal;
          quoteRequest.total = subTotal * 0.1 + subTotal;
          quoteRequest.save(function(err, saved) {
            if (err) {return res.send(500,err);}
            else {
              return res.json(200, saved);
            }
          });
        }
      });
    }
  });
};

exports.getQuoteRequestByContractorPackge = function(req, res) {
    QuoteRequest.find({'package': req.params.id}).populate('user').exec(function(err, quoteRequests) {
        if (err) {return res.send(500, err);}
        else {
            return res.json(quoteRequests);
        }
    });
};

exports.sendInvitationInContractor = function(req, res) {
    ContractorPackage.findById(req.body.id, function(err, contractorPackage) {
        if (err) {return res.send(500, err);}
        else {
            var newContractor = [];
            var to = contractorPackage.to;
            async.each(req.body.toContractor, function(emailPhone, callback) {
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
                newContractor.push({
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
                newContractor.push({
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
              contractorPackage.newInvitation = newContractor;
              contractorPackage.save(function(err, saved){
                if (err) {return res.send(500,err);}
                else {
                  return res.json(200,saved);
              }
              });
            }
        });
        }
    });
};