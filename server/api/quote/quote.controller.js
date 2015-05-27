'use strict';

var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var QuoteRequest = require('./../../models/quoteRequest.model');
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

    quote.save(function(err, savedQuote) {
        if (err) { return res.send(500, err);}
        return res.json(savedQuote);
    })

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
exports.show = function(req, res){
  //TODO - validate rol
  // Project.findById(req.params.id)
  // .populate('user')
  // .populate('homeBuilder')
  // .exec(function(err, project){
  //   if(err){ return errorsHelper.validationErrors(res, err); }

  //   return res.json(project);
  // });
  QuoteRequest.findById(req.params.id, function(err, quote) {
    if (err) {return res.send(500, err);}
    return res.json(quote);
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