'use strict';

var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var QuoteRequest = require('./../../models/quoteRequest.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var ContractorPackage = require('./../../models/contractorPackage.model');
var MaterialPackage = require('./../../models/materialPackage.model');
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
    Team.findOne({$or:[{leader: req.user._id},{'member._id': req.user._id}]}, function(err, team){
    if (err) {return res.send(500,err);}
    else {
      var quoteRequest = new QuoteRequest({
        user: req.user._id,
        team: team._id,
        description: req.body.quoteRequest.description,
        project: req.body.builderPackage.project._id,
        type: 'contractor to builder',
        package: req.body.builderPackage._id,
        packageType: 'builder',
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
            contractorPackage.winnerTeam._id = team._id;
            contractorPackage.quote = quote.total;
            contractorPackage.isAccept = true;
            _.remove(contractorPackage.to,{_id: team._id});
            _.each(contractorPackage.to, function(toContractor){
              if (toContractor._id) {
                Team.findById(toContractor._id, function(err,team){
                  if (err || !team) {return res.send(500,err);}
                  _.remove(team.project, contractorPackage.project);
                  team.markModified('project');
                  team.save(function(err){
                    if (err) {return res.send(500,err);}
                  });
                });
              }
            });
            contractorPackage.markModified('selectQuote');
            contractorPackage._ownerUser = quote.user;
            contractorPackage._editUser = req.user;
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
            materialPackage.winnerTeam._id = team._id;
            materialPackage.quote = quote.total;
            materialPackage.isSelect = true;
            _.remove(materialPackage.to,{_id: team._id});
            _.each(materialPackage.to, function(toMaterial){
              if (toMaterial._id) {
                Team.findById(toMaterial._id, function(err,team){
                  if (err || !team) {return res.send(500,err);}
                  _.remove(team.project, materialPackage.project);
                  team.markModified('project');
                  team.save(function(err){
                    if (err) {return res.send(500,err);}
                  });
                });
              }
            });
            materialPackage.markModified('selectQuote');
            materialPackage._ownerUser = quote.user;
            materialPackage._editUser = req.user;
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