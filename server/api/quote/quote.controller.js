'use strict';

var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var QuoteRequest = require('./../../models/quoteRequest.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var ContractorPackage = require('./../../models/contractorPackage.model');
var errorsHelper = require('../../components/helpers/errors');
var ProjectValidator = require('./../../validators/project');
var _ = require('lodash');
var async = require('async');
/**
 * create a new project
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */
exports.create = function(req, res){
    //create a new project
    // console.log(req.body.params);
    var data = req.body.params;
    var quote = new QuoteRequest(data);
    quote.user = req.user._id;
    quote.project = req.params.id;
    quote.type = req.user.type;
    quote.email = req.user.email;

    BuilderPackage.findOne({'project': req.params.id}, function(err, builderPackage) {
      if (err) {return res.send(500, err);}
      else {
        quote.package = builderPackage._id;
        quote.save(function(err, savedQuote) {
          if (err) { return res.send(500, err);}
          return res.json(savedQuote);
      })
      }
    });
};

exports.index = function(req, res) {
  QuoteRequest.find({}, function(err, quoteRequests) {
    if (err) 
      return res.send(500, err);
    res.json(200, quoteRequests);
  });
}

/**
 * show project detail
 */
exports.findOne = function(req, res){
  QuoteRequest.findById(req.params.id).populate('user').exec(function(err, quote) {
    console.log(quote);
    if (err) {return res.send(500, err);}
    else {
      ContractorPackage.findById(quote.package, function(err, contractorPackage) {
        if (err) {return res.send(500, err);}
        else {
          contractorPackage.winner._id = quote.user._id,
          contractorPackage.winner.email = quote.user.email,
          contractorPackage.quote = quote.price,
          contractorPackage.isAccept = true,
          contractorPackage.status = false
          contractorPackage.save(function(err, saved) {
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

exports.update = function(req, res) {
  // var quote = req.body.requestedHomeBuilders.quote;
  // var currentUser = req.user;
  // Project.findById(req.params.id, function(err, project){
  //   _.each(project.requestedHomeBuilders, function(requestedHomeBuilder) {
  //     if (currentUser.email == requestedHomeBuilder.email) {
  //       requestedHomeBuilder.quote = 123;
  //       project.save(function (err) {
  //         if (err){
  //           return errorsHelper.validationErrors(res, err);
  //         }
  //         res.send(200);
  //       });
  //     }
  //   });
  // });
  
};

exports.getByProjectId = function(req, res) {
  QuoteRequest.find({'project': req.params.id}, function(err, quoteRequests) {
    if (err) {return res.send(500, err);}
    else {
      return res.json(quoteRequests);
      // _.each(quoteRequests, function(quoteRequest) {
      //   console.log(quoteRequest);
      // });
    }
  });
};