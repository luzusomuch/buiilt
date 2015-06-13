'use strict';

var MaterialPackage = require('./../../models/materialPackage');
var QuoteRequest = require('./../../models/quoteRequest.model');
var ValidateInvite = require('./../../models/validateInvite.model');
var User = require('./../../models/user.model');
var _ = require('lodash');
var async = require('async');

exports.findOne = function(req, res) {
    MaterialPackage.findById(req.params.id).populate('project').exec(function(err, materialPackage) {
        if (err) {return res.send(500, err);}
        else {
            return res.json(materialPackage);
        }
    });
};

exports.sendQuote =function(req, res) {
    var quoteRequest = new QuoteRequest({
        user: req.user._id,
        description: req.body.quoteRequest.description,
        project: req.body.materialRequest.project._id,
        type: 'contractor to builder',
        package: req.body.materialRequest._id,
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

exports.getQuoteRequestByMaterialPackge = function(req, res) {
    QuoteRequest.find({'package': req.params.id}).populate('user').exec(function(err, quoteRequests) {
        if (err) {return res.send(500, err);}
        else {
            return res.json(quoteRequests);
        }
    });
};

exports.sendInvitationInMaterial = function(req, res) {
    MaterialPackage.findById(req.body.id, function(err, materialPackage) {
        if (err) {return res.send(500, err);}
        else {
            var newSuppliers = [];
            var to = materialPackage.to;
            async.each(req.body.toSupplier, function(emailPhone, callback) {
            User.findOne({'email': emailPhone.email}, function(err, user) {
              if (err) {return res.send(500,err);}
              if (!user) {
                var validateInvite = new ValidateInvite({
                  email: emailPhone.email,
                  inviteType: 'supplier'
                });
                validateInvite.save();
                to.push({
                  email: emailPhone.email,
                  phone: emailPhone.phoneNumber
                });
                newSuppliers.push({
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
                newSuppliers.push({
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
              materialPackage.to = to;
              materialPackage.newInvitation = newSuppliers;
              materialPackage.save(function(err, saved){
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