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
    quoteRequest.save(function(err, saved){
        if (err) {return res.send(500, err);}
        else {
            return res.json(saved);
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