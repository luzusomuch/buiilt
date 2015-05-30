'use strict';

var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var QuoteRequest = require('./../../models/quoteRequest.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var errorsHelper = require('./../../components/helpers/errors');
var quoteRequestValidator = require('./../../validators/quoteRequest');
var _ = require('lodash');
var async = require('async');

/**
 * get single package id
 */
exports.create = function(req, res){
  //validae
  quoteRequestValidator.validateCreate(req, function(err, data){
    if (err){ return res.send(422, err); }

    //check package
    BuilderPackage.findById(data.package, function(err, builderPackage){
      if (err){ return res.send(422, err); }
      if(!builderPackage){ return res.status(404).send(); }

      var request = new QuoteRequest(_.assign(data, {
        project: builderPackage.project,
        packageType: 'builder'
      }));

      request.save(function(err){
        if (err){ return res.send(422, err); }

        //
        return res.json(request);
      });
    });
  });
};

/**
 * get single package id
 */
exports.show = function(req, res){
  QuoteRequest.findById(req.params.id)
  .populate('project')
  .exec(function(err, builderPackage) {
    if (err){ return res.send(500, err); }

    res.json(builderPackage);
  });
};