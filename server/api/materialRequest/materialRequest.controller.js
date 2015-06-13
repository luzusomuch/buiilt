'use strict';

var MaterialPackage = require('./../../models/materialPackage');
var QuoteRequest = require('./../../models/quoteRequest.model');
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

exports.getQuoteRequestByMaterialPackge = function(req, res) {
    QuoteRequest.find({'package': req.params.id}).populate('user').exec(function(err, quoteRequests) {
        if (err) {return res.send(500, err);}
        else {
            return res.json(quoteRequests);
        }
    });
};