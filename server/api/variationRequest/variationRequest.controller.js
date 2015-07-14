'use strict';

var ContractorPackage = require('./../../models/contractorPackage.model');
var PackageInvite = require('./../../models/packageInvite.model');
var ValidateInvite = require('./../../models/validateInvite.model');
var QuoteRequest = require('./../../models/quoteRequest.model');
var Variation = require('./../../models/variation.model');
var User = require('./../../models/user.model');
var Team = require('./../../models/team.model');
var _ = require('lodash');
var async = require('async');

exports.findOne = function(req, res) {
    Variation.findById(req.params.id)
    .populate('to.quote')
    .populate('to._id')
    .populate('owner')
    .exec(function(err, variation){
        if (err) {return res.send(500,err);}
        if (!variation) {return res.send(404,err);}
        else {
          User.populate(variation,[
            {path : 'to._id.leader'},
            {path : 'owner.leader'}
          ],function(err,variation) {
            return res.send(200,variation);
          })
        }
    });
};

exports.sendQuote =function(req, res) {
    var quoteRequest = new QuoteRequest({
        user: req.user._id,
        team: req.user.team._id,
        description: req.body.quoteRequest.description,
        project: req.body.variationRequest.project,
        type: 'contractor to builder',
        package: req.body.variationRequest._id,
        packageType: 'contractor',
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
            if (err) {console.log(err);return res.send(500,err);}
            else {
              quoteRequest.quotePrice = quotePrice;
              quoteRequest.subTotal = subTotal;
              quoteRequest.total = subTotal * 0.1 + subTotal;
              quoteRequest.save(function(err, saved) {
                if (err) {return res.send(500,err);}
                else {
                  Variation.findById(req.body.variationRequest._id, function(err, variation){
                    if (err) {return res.send(500,err);}
                    else {
                      variation.to.quote = saved._id;
                      variation._quote = saved.total;
                      variation._editUser = req.user;
                      variation.markModified('sendQuote');
                      variation.save(function(err, savedVariation){
                        if (err) {return res.send(500,err);}
                        else {
                          return res.json(200, savedVariation);
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
exports.sendMessage = function(req, res) {
  Variation.findById(req.params.id, function(err, variation) {
    if (err) {return res.send(500,err)}
    if (!variation) {return res.send(404,err)}
    else {
      variation.messages.push({
        owner: req.body.team,
        to: req.body.to,
        sendBy: req.user.team._id,
        message: req.body.message
      });
      variation.markModified('sendMessage');
      variation._editUser = req.body.to;
      variation._ownerUser = req.user;
      variation.save(function(err, saved) {
        if (err) {return res.send(500, err)}
        else {
          saved.populate('messages.sendBy', function(err){
            if (err) {return res.send(500,err);}
            return res.json(200,saved);
          });
        }
      });
    }
  });
};

exports.sendMessageToBuilder = function(req, res) {
  Variation.findById(req.params.id, function(err, variation) {
    if (err) {return res.send(500,err)}
    if (!variation) {return res.send(404,err)}
    else {
      variation.messages.push({
        owner: variation.owner,
        to: req.body.team,
        sendBy: req.user.team._id,
        message: req.body.message
      });
      variation.markModified('sendMessageToBuilder');
      variation._editUser = req.user;
      variation.save(function(err, saved) {
        if (err) {return res.send(500, err)}
        saved.populate('messages.sendBy', function(err){
          if (err) {return res.send(500,err);}
          return res.json(200,saved);
        });
      });
    }
  });
};

exports.getMessageForBuilder = function(req, res) {
  Variation.findOne({$and:[{_id: req.params.id},{'messages.owner': req.user.team._id}]})
  .populate('messages.sendBy').exec(function(err, variation) {
    if (err) {return res.send(500,err);}
    if (!variation) {return res.send(404,err)}
    else {
      return res.json(200,variation);
    }
  });
};

exports.getMessageForContractor = function(req, res) {
  Variation.findOne({$and:[{_id: req.params.id},{'messages.to': req.user.team._id}]})
  .populate('messages.sendBy').exec(function(err, variation) {
    if (err) {return res.send(500,err);}
    if (!variation) {return res.send(404,err)}
    else {
      return res.json(200,variation);
    }
  });
};

exports.selectWinner = function(req, res) {
  Variation.findById(req.params.id, function(err,variation){
    if (err) {return res.send(500,err);}
    if (!variation) {return res.send(404,err);}
    else {
      variation.to.isSelect = true;
      variation.markModified('selectQuote');
      variation._editUser = req.user;
      variation.save(function(err,saved){
        if (err) {return res.send(500,err);}
        return res.send(200,saved);
      });
    }
  });
};

exports.cancelPackage = function(req, res) {
  Variation.findById(req.body.id, function(err, variation) {
    if (err) {return res.send(500,err);}
    else {
      variation.isCancel = true;
      variation.markModified('cancel-package');
      variation._editUser = req.user;
      variation.save(function(err, saved) {
        if (err) {return res.send(500,err);}
        else {
          return res.json(200, saved);
        }
      });
    }
  });
};

// exports.declineQuote = function(req, res) {
//   Variation.findById(req.params.id).populate('to.quote').exec(function(err, variation) {
//     if (err) {return res.send(500,err);}
//     else {
//       _.each(materialPackage.to, function(toMaterial){
//         if (toMaterial._id == req.body.belongTo) {
//           toMaterial.isDecline = true;
//           toMaterial._ownerUser = toMaterial.quote.user;
//         }
//       });
//       variation.to.
//       variation.markModified('decline-quote');
//       variation._editUser = req.user;
//       variation.save(function(err, saved) {
//         if (err) {return res.send(500,err);}
//         else {
//           return res.json(200, saved);
//         }
//       });
//     }
//   });
// };

exports.complete = function(req, res) {
  Variation.findById(req.params.id, function(err, variation){
    if (err) {return res.send(500,err);}
    if (!variation) {return res.send(404,err);}
    variation.isCompleted = !variation.isCompleted;
    variation.save(function(err,saved){
      if (err) {return res.send(500,err);}
      return res.send(200,saved);
    });
  });
};