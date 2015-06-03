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

        builderPackage.isSendQuote = true;
        builderPackage.save();

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
  .exec(function(err, quoteRequest) {
    if (err){ return res.send(500, err); }

    //get json data
    var packageJson = quoteRequest.toJSON();

    //find builder package
    BuilderPackage.findOne({_id: packageJson.package}, function(err, builderPackage){
      if(!err){
        packageJson.package = builderPackage;
      }else{
        packageJson.package = {};
      }

      res.json(packageJson);
    });
  });
};

exports.selectQuote = function(req, res) {
  QuoteRequest.findById(req.params.id, function(err, quoteRequest){
    if (err) {return res.send(500,err);}
    else {
      quoteRequest.status = 'selected';
      quoteRequest.save(function(err, quoteRequestSaved) {
        if (err) {return res.send(500, err);}
        else {
          // return res.json(quoteRequestSaved);
          Project.findById(quoteRequestSaved.project, function(err, project) {
            if (err) {return res.send(500, err);}
            else {
              project.user = req.user._id;
              project.save(function(err, saved) {
                if (err) {return res.send(500, err);}
                else {
                  return res.json(saved);
                }
              });
            }
          });
        }
      });
    }
  });
};