'use strict';

var ContractorPackage = require('./../../models/contractorPackage.model');
var PackageInvite = require('./../../models/packageInvite.model');
var ValidateInvite = require('./../../models/validateInvite.model');
var QuoteRequest = require('./../../models/quoteRequest.model');
var User = require('./../../models/user.model');
var Team = require('./../../models/team.model');
var _ = require('lodash');
var async = require('async');

exports.findOne = function(req, res) {
    ContractorPackage.findById(req.params.id)
      .populate('project')
      .populate('winnerTeam._id')
      .populate('owner')
      .populate('to.quote')
      .populate('variations')
      .exec(function(err, contractorPackage) {
        if (err) {
          return res.send(500, err);
        }

        User.populate(contractorPackage, [
          {path : 'winnerTeam._id.member._id'},
          {path : 'winnerTeam._id.leader'},
          {path : 'owner.member._id'},
          {path : 'owner.leader'}
        ],function(err,_contractorPackage) {
          if (err) {
            return res.send(500, err);
          }
          return res.json(contractorPackage);
        })
    });
};

exports.contractorPackage = function(req,res,next) {
  ContractorPackage.findById(req.params.id)
    .populate('project')
    .populate('winnerTeam._id')
    .populate('owner')
    .exec(function(err, contractorPackage) {
      if (err) {return res.send(500,err)}
      if (!contractorPackage) {return res.send(404,err)}
      req.contractorPackage = contractorPackage;
      next();
  })
}

exports.sendMessage = function(req, res) {
  ContractorPackage.findById(req.params.id, function(err, contractorPackage) {
    if (err) {return res.send(500,err)}
    if (!contractorPackage) {return res.send(404,err)}
    else {
      if (!contractorPackage.messages) {
        var messages = [];
        messages.push({
          owner: req.body.team,
          to: req.body.to,
          message: req.body.message
        });
        contractorPackage.messages = messages;
        contractorPackage.save(function(err, saved) {
          if (err) {return res.send(500, err)}
          else {
            return res.json(200,saved);
          }
        });
      }
      else {
        contractorPackage.messages.push({
          owner: req.body.team,
          to: req.body.to,
          sendBy: req.user.team._id,
          message: req.body.message
        });
        contractorPackage.markModified('sendMessage');
        contractorPackage._editUser = req.body.to;
        contractorPackage._ownerUser = req.user;
        contractorPackage.save(function(err, saved) {
          if (err) {return res.send(500, err)}
          else {
            saved.populate('messages.sendBy', function(err){
              if (err) {return res.send(500,err);}
              return res.json(200,saved);
            });
          }
        });
      }
    }
  });
};

exports.sendMessageToBuilder = function(req, res) {
  ContractorPackage.findById(req.params.id, function(err, contractorPackage) {
    if (err) {return res.send(500,err)}
    if (!contractorPackage) {return res.send(404,err)}
    else {
      if (!contractorPackage.messages) {
        var messages = [];
        messages.push({
          owner: contractorPackage.owner,
          to: req.body.team,
          sendBy: req.user.team._id,
          message: req.body.message
        });
        contractorPackage.messages = messages;
        contractorPackage.save(function(err, saved) {
          if (err) {return res.send(500, err)}
          else {
            return res.json(200,saved);
          }
        });
      }
      else {
        contractorPackage.messages.push({
          owner: contractorPackage.owner,
          to: req.body.team,
          sendBy: req.user.team._id,
          message: req.body.message
        });
        contractorPackage.markModified('sendMessageToBuilder');
        contractorPackage._editUser = req.user;
        contractorPackage.save(function(err, saved) {
          if (err) {return res.send(500, err)}
          else {
            saved.populate('messages.sendBy', function(err){
              if (err) {return res.send(500,err);}
              return res.json(200,saved);
            });
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
      ContractorPackage.findOne({$and:[{_id: req.params.id},{'messages.owner': team._id}]})
      .populate('messages.sendBy').exec(function(err, contractorPackage) {
        if (err) {console.log(err);}
        if (!contractorPackage) {return res.send(404,err)}
        else {
          return res.json(200,contractorPackage);
        }
      });
    }
  });
};

exports.getMessageForContractor = function(req, res) {
  Team.findOne({$or:[{leader: req.user._id},{'member._id': req.user._id}]}, function(err, team){
    if (err) {return res.send(500,err);}
    else {
      ContractorPackage.findOne({$and:[{_id: req.params.id},{'messages.to': team._id}]})
      .populate('messages.sendBy').exec(function(err, contractorPackage) {
        if (err) {return res.send(500,err);}
        if (!contractorPackage) {return res.send(404,err)}
        else {
          return res.json(200,contractorPackage);
        }
      });
    }
  });
  
};

exports.sendQuote =function(req, res) {
  Team.findOne({$or:[{leader: req.user._id},{'member._id': req.user._id}]}, function(err, team){
    if (err) {return res.send(500,err);}
    else {
      var quoteRequest = new QuoteRequest({
        user: req.user._id,
        team: team._id,
        description: req.body.quoteRequest.description,
        project: req.body.contractorRequest.project._id,
        type: 'contractor to builder',
        package: req.body.contractorRequest._id,
        packageType: 'contractor',
        price: req.body.quoteRequest.price
      });
      var quoteRate = [];
      var quotePrice = [];
      var subTotal = 0;
      if (req.body.rate) {
        _.each(req.body.rate, function(rate){
          if (rate) {
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
        });
      }
      if (req.body.price) {
        _.each(req.body.price, function(price){
          if (price) {
            for (var i = 0; i < req.body.price.length -1; i++) {
              quotePrice.push({
                description: price.description[i],
                price: price.price[i],
                quantity: 1,
                total: price.price[i]
              });
              subTotal += price.price[i];
            };
          }
        });
      }
      quoteRequest.quoteRate = quoteRate;
      quoteRequest.quotePrice = quotePrice;
      quoteRequest.subTotal = parseFloat(subTotal);
      quoteRequest.total = parseFloat(subTotal) * 0.1 + parseFloat(subTotal);
      quoteRequest.save(function(err, saved) {
        if (err) {return res.send(500,err);}
        ContractorPackage.findById(req.body.contractorRequest._id, function(err, contractorPackage){
          if (err) {return res.send(500,err);}
          else {
            _.each(contractorPackage.to, function(to){
              if (to._id) {
                if (to._id.toString() == team._id.toString()) {
                  to._id = team._id,
                  to.email = to.email,
                  to.quote = saved._id;
                }
              }
            });
            contractorPackage._quote = saved.total;
            contractorPackage._editUser = req.user;
            contractorPackage.markModified('sendQuote');
            contractorPackage.save(function(err, savedContractorPackage){
              if (err) {return res.send(500,err);}
              else {
                return res.json(200, saved);
              }
            });
          }
        });
      });
    }
  });
};

exports.getQuoteRequestByContractorPackge = function(req, res) {
    QuoteRequest.find({'package': req.params.id}).populate('user').exec(function(err, quoteRequests) {
        if (err) {return res.send(500, err);}
        else {
            return res.json(quoteRequests);
        }
    });
};

exports.sendInvitationInContractor = function(req, res) {
    ContractorPackage.findById(req.body.id, function(err, contractorPackage) {
        if (err) {return res.send(500, err);}
        else {
          var newContractor = [];
          var to = contractorPackage.to;
          async.each(req.body.toContractor, function(emailPhone, callback) {
            User.findOne({'email': emailPhone.email}, function(err, user) {
              if (err) {return callback(err);}
              if (!user) {
                to.push({
                  email: emailPhone.email,
                  phone: emailPhone.phoneNumber
                });
                newContractor.push({
                  email: emailPhone.email,
                  phone: emailPhone.phoneNumber
                });
                callback();
            }
            else {
              if (user.team._id) {
                to.push({
                  _id: user.team._id,
                  email: emailPhone.email,
                  phone: emailPhone.phoneNumber
                });
                newContractor.push({
                  _id: user.team._id,
                  email: emailPhone.email,
                  phone: emailPhone.phoneNumber
                });
                Team.findById(user.team._id, function(err,team){
                  if (err) {return res.send(500,err);}
                  team.project.push(contractorPackage.project);
                  team.save(function(err){
                    if (err) {return res.send(500,err);}
                  })
                });
                callback();
              }
            }
        });
        }, function(err) {
            if (err) {return res.send(500,err);}
            else {
              contractorPackage.to = to;
              contractorPackage.newInvitation = newContractor;
              contractorPackage._ownerUser = req.user;
              contractorPackage._editUser = req.user;
              contractorPackage.markModified('inviteContractor');
              contractorPackage.save(function(err, saved){
                if (err) {return res.send(500,err);}
                else {
                  saved.populate('to.quote', function(err){
                    if (err) {return res.send(500,err);}
                    return res.json(200,saved);
                  });
                }
              });
            }
        });
        }
    });
};

exports.sendVariation = function(req, res) {
  ContractorPackage.findById(req.params.id, function(err, contractorPackage) {
    if (err) {return res.send(500,err)}
    if (!contractorPackage) {return res.send(404,err)}
    else {
      if (!contractorPackage.variations) {
        var variations = [];
        variations.push({
          owner: req.user._id,
          title: req.body.variation.title,
          description: req.body.variation.description
        });
        contractorPackage.variations = variations;
        contractorPackage.save(function(err, saved) {
          if (err) {return res.send(500, err)}
          else {
            return res.json(200,saved);
          }
        });
      }
      else {
        contractorPackage.variations.push({
          owner: req.user._id,
          title: req.body.variation.title,
          description: req.body.variation.description
        });
        contractorPackage.save(function(err, saved) {
          if (err) {return res.send(500, err)}
          else {
            return res.json(200,saved);
          }
        });
      }
    }
  });
};

exports.sendDefect = function(req, res) {
  ContractorPackage.findById(req.params.id, function(err, contractorPackage) {
    if (err) {return res.send(500,err)}
    if (!contractorPackage) {return res.send(404,err)}
    else {
      if (!contractorPackage.defects) {
        var defects = [];
        defects.push({
          owner: req.user._id,
          title: req.body.defect.title,
          location: req.body.defect.location,
          description: req.body.defect.description
        });
        contractorPackage.defects = defects;
        contractorPackage.save(function(err, saved) {
          if (err) {return res.send(500, err)}
          else {
            return res.json(200,saved);
          }
        });
      }
      else {
        contractorPackage.defects.push({
          owner: req.user._id,
          title: req.body.defect.title,
          location: req.body.defect.location,
          description: req.body.defect.description
        });
        contractorPackage.save(function(err, saved) {
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
  ContractorPackage.findById(req.params.id, function(err, contractorPackage) {
    if (err) {return res.send(500,err);}
    if (!contractorPackage) {return res.send(404,err);}
    else {
      var invoices = contractorPackage.invoices;
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
              contractorPackage.invoices = invoices;
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
    }
  });
};

exports.sendAddendum = function(req, res) {
  ContractorPackage.findById(req.body.id, function(err, contractorPackage) {
    if (err) {return res.send(500,err)}
    if (!contractorPackage) {return res.send(404,err)}
    else {
      if (contractorPackage.addendums) {
        var addendums = contractorPackage.addendums;
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
        contractorPackage.addendums = addendums;
        contractorPackage.save(function(err, saved){
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
        contractorPackage.addendums = addendums;
        contractorPackage.save(function(err, saved){
          if (err) {return res.send(500, err);}
          else {
            return res.json(200,saved);
          }
        });
      }
    }
  });
};

//cancel package
exports.cancelPackage = function(req, res) {
  ContractorPackage.findById(req.body.id, function(err, contractorPackage) {
    if (err) {return res.send(500,err);}
    else {
      contractorPackage.isCancel = true;
      contractorPackage.markModified('cancel-package');
      contractorPackage._editUser = req.user;
      contractorPackage.save(function(err, saved) {
        if (err) {return res.send(500,err);}
        else {
          return res.json(200, saved);
        }
      });
    }
  });
};

exports.declineQuote = function(req, res) {
  ContractorPackage.findById(req.body.id).populate('to.quote').exec(function(err, contractorPackage) {
    if (err) {return res.send(500,err);}
    else {
      var ownerUser = {};
      _.each(contractorPackage.to, function(toContractor){
        if (toContractor._id == req.body.belongTo) {
          toContractor.isDecline = true;
          ownerUser = toContractor.quote.user;
          Team.findById(toContractor._id, function(err,team){
            if (err || !team) {return res.send(500,err);}
            var index = team.project.indexOf(contractorPackage.project);
            team.project.splice(index,1);
            team.markModified('project');
            team.save(function(err){
              if (err) {return res.send(500,err);}
            });
          });
          toContractor._id = null;
          toContractor.quote = null;
        }
      });
      contractorPackage.markModified('decline-quote');
      contractorPackage._ownerUser = ownerUser;
      contractorPackage._editUser = req.user;
      contractorPackage.save(function(err, saved) {
        if (err) {return res.send(500,err);}
        else {
          return res.json(200, saved);
        }
      });
    }
  });
};

exports.complete = function(req,res) {
  var contractorPackage = req.contractorPackage
  contractorPackage.isCompleted = !contractorPackage.isCompleted
  contractorPackage.save(function(err) {
    if (err) {
      return res.send(500,err);
    }
    User.populate(contractorPackage, [
      {path : 'winnerTeam._id.member._id'},
      {path : 'winnerTeam._id.leader'},
      {path : 'owner.member._id'},
      {path : 'owner.leader'}
    ],function(err,contractorPackage) {
      if (err) {
        return res.send(500, err);
      }
      return res.json(contractorPackage);
    })
  })
};