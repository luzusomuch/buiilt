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

    quote.save(function(err, savedQuote) {
        if (err) { console.log(err);}
        return res.json(savedQuote);
    })

};

/**
 * show project detail
 */
exports.show = function(req, res){
  //TODO - validate rol
  Project.findById(req.params.id)
  .populate('user')
  .populate('homeBuilder')
  .exec(function(err, project){
    if(err){ return errorsHelper.validationErrors(res, err); }

    return res.json(project);
  });
};

exports.update = function(req, res) {
  var quote = req.body.requestedHomeBuilders.quote;
  var currentUser = req.user;
  Project.findById(req.params.id, function(err, project){
    _.each(project.requestedHomeBuilders, function(requestedHomeBuilder) {
      if (currentUser.email == requestedHomeBuilder.email) {
        requestedHomeBuilder.quote = 123;
        project.save(function (err) {
          if (err){
            return errorsHelper.validationErrors(res, err);
          }
          res.send(200);
        });
      }
    });
  });
  
};