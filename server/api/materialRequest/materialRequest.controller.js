'use strict';

var MaterialPackage = require('./../../models/materialPackage.model');
var QuoteRequest = require('./../../models/quoteRequest.model');
var ValidateInvite = require('./../../models/validateInvite.model');
var User = require('./../../models/user.model');
var Team = require('./../../models/team.model');
var _ = require('lodash');
var async = require('async');

exports.findOne = function(req, res) {
    MaterialPackage.findById(req.params.id)
      .populate('winnerTeam._id')
      .populate('owner')
      .populate('to.quote')
      .populate('variations')
      .populate('project').exec(function(err, materialPackage) {
        if (err) {return res.send(500, err);}
        else {
          User.populate(materialPackage, [
            {path : 'winnerTeam._id.member._id'},
            {path : 'winnerTeam._id.leader'},
            {path : 'owner.member._id'},
            {path : 'owner.leader'}
          ],function(err,_materialPackage) {
            if (err) {
              return res.send(500, err);
            }
            return res.json(_materialPackage);
          })
        }
    });
};

exports.materialPackage = function(req,res,next) {
  MaterialPackage.findById(req.params.id)
    .populate('winnerTeam._id')
    .populate('owner')
    .populate('project')
    .exec(function(err, materialPackage) {
      if (err) {return res.send(500, err);}
      req.materialPackage = materialPackage;
      next();
    })
}

exports.sendQuote =function(req, res) {
    var quoteRequest = new QuoteRequest({
        user: req.user._id,
        team : req.user.team._id,
        description: req.body.quoteRequest.description,
        project: req.body.materialRequest.project._id,
        type: 'supplier to builder',
        package: req.body.materialRequest._id,
        packageType: 'supplier',
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
              MaterialPackage.findById(req.body.materialRequest._id, function(err, materialPackage){
                if (err) {return res.send(500,err);}
                else {
                  _.each(materialPackage.to, function(to){
                    if (to._id) {
                      if (to._id.toString() == req.user.team._id.toString()) {
                        to._id = req.user.team._id,
                        to.email = to.email,
                        to.quote = saved._id;
                      }
                    }
                  });
                  materialPackage._quote = saved.total;
                  materialPackage._editUser = req.user;
                  materialPackage.markModified('sendQuote');
                  materialPackage.save(function(err, savedMaterialPackage){
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
      })
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
              if (err) {return callback(err);}
              if (!user) {
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
                  _id: user.team._id,
                  email: emailPhone.email,
                  phone: emailPhone.phoneNumber
              });
                newSuppliers.push({
                  _id: user.team._id,
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
              materialPackage._ownerUser = req.user;
              materialPackage._editUser = req.user;
              materialPackage.markModified('inviteMaterial');
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

exports.sendMessage = function(req, res) {
  MaterialPackage.findById(req.params.id, function(err, materialPackage) {
    if (err) {return res.send(500,err)}
    if (!materialPackage) {return res.send(404,err)}
    else {
      if (!materialPackage.messages) {
        var messages = [];
        messages.push({
          owner: req.user.team._id,
          to: req.body.to,
          message: req.body.message
        });
        materialPackage.messages = messages;
        materialPackage.save(function(err, saved) {
          if (err) {return res.send(500, err)}
          else {
            return res.json(200,saved);
          }
        });
      }
      else {
        materialPackage.messages.push({
          owner: req.user.team._id,
          to: req.body.to,
          message: req.body.message
        });
        materialPackage.save(function(err, saved) {
          if (err) {return res.send(500, err)}
          else {
            return res.json(200,saved);
          }
        });
      }
    }
  });
};

exports.sendMessageToBuilder = function(req, res) {
  MaterialPackage.findById(req.params.id, function(err, materialPackage) {
    if (err) {return res.send(500,err)}
    if (!materialPackage) {return res.send(404,err)}
    else {
      if (!materialPackage.messages) {
        var messages = [];
        messages.push({
          owner: materialPackage.owner,
          to: req.body.team,
          message: req.body.message
        });
        materialPackage.messages = messages;
        materialPackage.save(function(err, saved) {
          if (err) {return res.send(500, err)}
          else {
            return res.json(200,saved);
          }
        });
      }
      else {
        materialPackage.messages.push({
          owner: materialPackage.owner,
          to: req.body.team,
          message: req.body.message
        });
        materialPackage.save(function(err, saved) {
          if (err) {return res.send(500, err)}
          else {
            return res.json(200,saved);
          }
        });
      }
    }
  });
};

exports.getMessageForBuilder = function(req, res) {
  Team.findOne({$or:[{leader: req.user._id},{'member._id': req.user._id}]}, function(err, team){
    if (err) {return res.send(500,err);}
    else {
      MaterialPackage.findOne({$and:[{_id: req.params.id},{'messages.owner': team._id}]}, function(err, materialPackage) {
        if (err) {return res.send(500,err);}
        if (!materialPackage) {return res.send(500,err)}
        else {
          return res.json(200,materialPackage);
        }
      });
    }
  });
};

exports.getMessageForSupplier = function(req, res) {
  MaterialPackage.findOne({$and:[{_id: req.params.id},{'messages.to': req.user.team._id}]}, function(err, materialPackage) {
    if (err) {console.log(err);}
    if (!materialPackage) {return res.send(500,err)}
    else {
      return res.json(200,materialPackage);
    }
  });
};

exports.sendDefect = function(req, res) {
  MaterialPackage.findById(req.params.id, function(err, materialPackage) {
    if (err) {return res.send(500,err)}
    if (!materialPackage) {return res.send(404,err)}
    else {
      if (!materialPackage.defects) {
        var defects = [];
        defects.push({
          owner: req.user._id,
          title: req.body.defect.title,
          location: req.body.defect.location,
          description: req.body.defect.description
        });
        materialPackage.defects = defects;
        materialPackage.save(function(err, saved) {
          if (err) {return res.send(500, err)}
          else {
            return res.json(200,saved);
          }
        });
      }
      else {
        materialPackage.defects.push({
          owner: req.user._id,
          title: req.body.defect.title,
          location: req.body.defect.location,
          description: req.body.defect.description
        });
        materialPackage.save(function(err, saved) {
          if (err) {return res.send(500, err)}
          else {
            return res.json(200,saved);
          }
        });
      }
    }
  });
};

exports.sendInvoice = function(req, res) {
  MaterialPackage.findById(req.params.id, function(err, materialPackage) {
    if (err) {return res.send(500,err);}
    if (!materialPackage) {return res.send(404,err);}
    else {
      var invoices = materialPackage.invoices;
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
              invoices.push({
                owner: req.user._id,
                title: req.body.invoice.title,
                quoteRate: quoteRate,
                quotePrice: quotePrice,
                subTotal: subTotal,
                total: subTotal * 0.1 + subTotal
              });
              materialPackage.invoices = invoices;
              materialPackagew.save(function(err, saved) {
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

exports.sendAddendum = function(req, res) {
  MaterialPackage.findById(req.body.id, function(err, materialPackage) {
    if (err) {return res.send(500,err)}
    if (!materialPackage) {return res.send(404,err)}
    else {
      if (materialPackage.addendums) {
        var addendums = materialPackage.addendums;
        var addendumsScope = [];
        _.each(req.body.addendumScope, function(addendumScope) {
          addendumsScope.push({
            description: addendumScope.scopeDescription,
            quantity: addendumScope.quantity
          });
        });
        addendums.push({
          description: req.body.description.description,
          addendumsScope: addendumsScope
        });
        materialPackage.addendums = addendums;
        materialPackage.save(function(err, saved){
          if (err) {return res.send(500, err);}
          else {
            return res.json(200,saved);
          }
        });
      }
      else {
        var addendums = [];
        var addendumsScope = [];
        _.each(req.body.addendumScope, function(addendumScope) {
          addendumsScope.push({
            description: addendumScope.scopeDescription,
            quantity: addendumScope.quantity
          });
        });
        addendums.push({
          description: req.body.description.description,
          addendumsScope: addendumsScope
        });
        materialPackage.addendums = addendums;
        materialPackage.save(function(err, saved){
          if (err) {return res.send(500, err);}
          else {
            return res.json(200,saved);
          }
        });
      }
    }
  });
};

exports.complete = function(req,res) {
  var materialPackage = req.materialPackage
  materialPackage.isCompleted = !materialPackage.isCompleted
  materialPackage.save(function(err) {
    if (err) {
      return res.send(500,err);
    }
    User.populate(materialPackage, [
      {path : 'winnerTeam._id.member._id'},
      {path : 'winnerTeam._id.leader'},
      {path : 'owner.member._id'},
      {path : 'owner.leader'}
    ],function(err,materialPackage) {
      if (err) {
        return res.send(500, err);
      }
      return res.json(materialPackage);
    })
  })
};