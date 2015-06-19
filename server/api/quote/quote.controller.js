'use strict';

var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var QuoteRequest = require('./../../models/quoteRequest.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var ContractorPackage = require('./../../models/contractorPackage.model');
var MaterialPackage = require('./../../models/materialPackage');
var Team = require('./../../models/team.model');
var errorsHelper = require('../../components/helpers/errors');
var ProjectValidator = require('./../../validators/project');
var UserValidator = require('./../../validators/user');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var okay = require('okay');
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
    if (err) {return res.send(500, err);}
    else {
      Team.findOne({$or:[{leader: quote.user}, {'member._id': quote.user}]}, function(err, team) {
        if (err) {return res.send(500,err);}
        if (!team) {return res.send(404,err);}
        else {
          ContractorPackage.findById(quote.package, function(err, contractorPackage) {
          if (err) {return res.send(500, err);}
          else {
            contractorPackage.winnerTeam._id = team._id,
            contractorPackage.quote = quote.total,
            contractorPackage.isAccept = true,
            contractorPackage.status = false
            contractorPackage.save(function(err, saved) {
              if (err) {return res.send(500,err);}
              else {
                ContractorPackage.findById(saved._id).populate('winnerTeam._id').exec(function(err,contractorPackage) {
                  if (err) {return res.send(500,err);}
                  else {
                    return res.json(200,contractorPackage);
                  }
                }); 
              }
            });
          }
        });
        }
      })
    }
  });
};

exports.getByMaterial = function(req, res){
  QuoteRequest.findById(req.params.id).populate('user').exec(function(err, quote) {
    if (err) {return res.send(500, err);}
    else {
      Team.findOne({$or:[{leader: quote.user}, {'member._id': quote.user}]}, function(err, team) {
        if (err) {return res.send(500, err);}
        if (!team) {return res.send(404, err);}
        else {
          MaterialPackage.findById(quote.package, function(err, materialPackage) {
          if (err) {return res.send(500, err);}
          else {
            materialPackage.winnerTeam._id = team._id,
            materialPackage.quote = quote.total,
            materialPackage.isAccept = true,
            materialPackage.status = false
            materialPackage.save(function(err, saved) {
              if (err) {return res.send(500,err);}
              else {
                MaterialPackage.findById(saved._id).populate('winnerTeam._id').exec(function(err,materialPackage) {
                  if (err) {return res.send(500,err);}
                  else {
                    return res.json(200,materialPackage);
                  }
                }); 
              }
            });
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

exports.createUserForHomeBuilderRequest = function(req, res, next) {
  UserValidator.validateNewUser(req, okay(next, function (data) {
    var newUser = new User(data);
    newUser.provider = 'local';
    newUser.role = 'user';
    newUser.save(function (err, user) {
      if (err) {
        return res.send(res, err);
      }
      QuoteRequest.findById(data.idParams).populate('project').exec(function(err, result) {
        if (err) {return res.send(500, err);}
        else {
          Project.findById(result.project._id, function(err, project) {
            if (err) {return res.send(500, err);}
            else {
              project.user = user._id
              project.save();
            }
          });  
        }
      });
      //update project for user
      // Project.find({'requestedHomeBuilders.email': req.body.email}, function (err, projects) {
      //   if (err) {
      //     console.log(err);
      //   }
      //   else {
      //     _.each(projects, function (pj) {
      //       _.each(pj.requestedHomeBuilders, function (builder) {
      //         if (builder.email === req.body.email) {
      //           builder._id = newUser._id;
      //           pj.save();
      //         }
      //       });
      //     });
      //   }
      // });

      var token = jwt.sign({_id: user._id}, config.secrets.session, {expiresInMinutes: 60 * 5});
      res.json({token: token});
    });
  }));
};