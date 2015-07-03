'use strict';

var ContractorPackage = require('./../../models/contractorPackage.model');
var MaterialPackage = require('./../../models/materialPackage.model');
var PackageInvite = require('./../../models/packageInvite.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var StaffPackage = require('./../../models/staffPackage.model');
var Variation = require('./../../models/variation.model');
var ValidateInvite = require('./../../models/validateInvite.model');
var QuoteRequest = require('./../../models/quoteRequest.model');
var Variation = require('./../../models/variation.model');
var User = require('./../../models/user.model');
var Team = require('./../../models/team.model');
var _ = require('lodash');
var async = require('async');

exports.sendDefect = function(req, res) {
    var packageType = req.body.packageType;
    if (packageType == 'contractor') {
        ContractorPackage.findById(req.params.id, function(err, contractorPackage){
            if (err) {return res.send(500,err);}
            else {
                contractorPackage.defects.push({
                    owner: req.user._id,
                    title: req.body.defect.title,
                    location: req.body.defect.location,
                    description: req.body.defect.description
                });
                contractorPackage.markModified('sendDefect');
                contractorPackage._editUser = req.user;
                contractorPackage.save(function(err, savedContractorPacakge){
                    if (err) {return res.send(500,err);}
                    else {
                        return res.json(savedContractorPacakge);
                    }
                });
            }
        });
    }
    else if (packageType == 'material'){
        MaterialPackage.findById(req.params.id, function(err, materialPackage){
            if (err) {return res.send(500,err);}
            else {
                materialPackage.defects.push({
                    owner: req.user._id,
                    title: req.body.defect.title,
                    location: req.body.defect.location,
                    description: req.body.defect.description
                });
                materialPackage.markModified('sendDefect');
                materialPackage._editUser = req.user;
                materialPackage.save(function(err, savedMaterialPacakge){
                    if (err) {return res.send(500,err);}
                    else {
                        return res.json(savedMaterialPacakge);
                    }
                });
            }
        });
    }
    else if (packageType == 'BuilderPackage') {
        BuilderPackage.findById(req.params.id, function(err, builderPackage){
            if (err) {return res.send(500,err);}
            else {
                builderPackage.defects.push({
                    owner: req.user._id,
                    title: req.body.defect.title,
                    location: req.body.defect.location,
                    description: req.body.defect.description
                });
                builderPackage.markModified('sendDefect');
                builderPackage._editUser = req.user;
                builderPackage.save(function(err, savedBuilderPackage){
                    if (err) {return res.send(500,err);}
                    else {
                        return res.json(savedBuilderPackage);
                    }
                });
            }
        });
    }
    else if (packageType == 'staffPackage') {
        StaffPackage.findById(req.params.id, function(err, staffPackage){
            if (err) {return res.send(500,err);}
            else {
                staffPackage.defects.push({
                    owner: req.user._id,
                    title: req.body.defect.title,
                    location: req.body.defect.location,
                    description: req.body.defect.description
                });
                staffPackage.markModified('sendDefect');
                staffPackage._editUser = req.user;
                staffPackage.save(function(err, savedStaffPackage){
                    if (err) {return res.send(500,err);}
                    else {
                        return res.json(savedStaffPackage);
                    }
                });
            }
        });
    }
    else if (packageType == 'variation') {
        Variation.findById(req.params.id, function(err, variation){
            if (err) {return res.send(500,err);}
            else {
                variation.defects.push({
                    owner: req.user._id,
                    title: req.body.defect.title,
                    location: req.body.defect.location,
                    description: req.body.defect.description
                });
                variation.markModified('sendDefect');
                variation._editUser = req.user;
                variation.save(function(err, savedVariation){
                    if (err) {return res.send(500,err);}
                    else {
                        return res.json(savedVariation);
                    }
                });
            }
        });
    }
    else {
        return res.send(500);
    }
};

exports.sendVariation = function(req, res) {
    var packageType = req.body.packageType;
    if (packageType == 'contractor') {
        ContractorPackage.findById(req.params.id, function(err, contractorPackage){
            if (err) {return res.send(500,err);}
            else {
                var variation = new Variation({
                    owner: contractorPackage.owner,
                    project: contractorPackage.project,
                    package: contractorPackage._id,
                    name: req.body.variation.title,
                    description: req.body.variation.description,
                    type: 'variation',
                    'to._id': contractorPackage.winnerTeam._id
                });
                variation.save(function(err,saved){
                    if (err) {return res.send(500,err);}
                    contractorPackage.variations.push(saved._id);
                    contractorPackage.markModified('sendVariation');
                    contractorPackage._editUser = req.user;
                    contractorPackage.save(function(err, savedContractorPacakge){
                        if (err) {return res.send(500,err);}
                        else {
                            return res.json(saved);
                        }
                    });
                });
            }
        });
    }
    else if (packageType == 'material'){
        MaterialPackage.findById(req.params.id, function(err, materialPackage){
            if (err) {return res.send(500,err);}
            else {
                materialPackage.variations.push({
                    owner: req.user._id,
                    title: req.body.variation.title,
                    description: req.body.variation.description
                });
                materialPackage.markModified('sendVariation');
                materialPackage._editUser = req.user;
                materialPackage.save(function(err, savedMaterialPacakge){
                    if (err) {return res.send(500,err);}
                    else {
                        return res.json(savedMaterialPacakge);
                    }
                });
            }
        });
    }
    else if (packageType == 'BuilderPackage') {
        BuilderPackage.findById(req.params.id, function(err, builderPackage){
            if (err) {return res.send(500,err);}
            else {
                builderPackage.variations.push({
                    owner: req.user._id,
                    title: req.body.variation.title,
                    description: req.body.variation.description
                });
                builderPackage.markModified('sendVariation');
                builderPackage._editUser = req.user;
                builderPackage.save(function(err, savedBuilderPackage){
                    if (err) {return res.send(500,err);}
                    else {
                        return res.json(savedBuilderPackage);
                    }
                });
            }
        });
    }
    else {
        return res.send(500);
    }
};

exports.sendInvoice = function(req, res) {
    var packageType = req.body.packageType;
    if (packageType == 'contractor') {
        ContractorPackage.findById(req.params.id, function(err, contractorPackage) {
            if (err) {return res.send(500,err);}
            else {
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
                            contractorPackage.invoices.push({
                                owner: req.user._id,
                                title: req.body.invoice.title,
                                quoteRate: quoteRate,
                                quotePrice: quotePrice,
                                subTotal: subTotal,
                                total: subTotal * 0.1 + subTotal
                            });
                            contractorPackage.markModified('sendInvoice');
                            contractorPackage._editUser = req.user;
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
    }
    else if (packageType == 'material'){
        MaterialPackage.findById(req.params.id, function(err, materialPackage) {
            if (err) {return res.send(500,err);}
            else {
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
                            materialPackage.invoices.push({
                                owner: req.user._id,
                                title: req.body.invoice.title,
                                quoteRate: quoteRate,
                                quotePrice: quotePrice,
                                subTotal: subTotal,
                                total: subTotal * 0.1 + subTotal
                            });
                            materialPackage.markModified('sendInvoice');
                            materialPackage._editUser = req.user;
                            materialPackage.save(function(err, saved) {
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
    }
    else if (packageType == 'BuilderPackage'){
        BuilderPackage.findById(req.params.id, function(err, builderPackage) {
            if (err) {return res.send(500,err);}
            else {
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
                            builderPackage.invoices.push({
                                owner: req.user._id,
                                title: req.body.invoice.title,
                                quoteRate: quoteRate,
                                quotePrice: quotePrice,
                                subTotal: subTotal,
                                total: subTotal * 0.1 + subTotal
                            });
                            builderPackage.markModified('sendInvoice');
                            builderPackage._editUser = req.user;
                            builderPackage.save(function(err, saved) {
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
    }
    else if (packageType == 'staffPackage'){
        StaffPackage.findById(req.params.id, function(err, staffPackage) {
            if (err) {return res.send(500,err);}
            else {
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
                            staffPackage.invoices.push({
                                owner: req.user._id,
                                title: req.body.invoice.title,
                                quoteRate: quoteRate,
                                quotePrice: quotePrice,
                                subTotal: subTotal,
                                total: subTotal * 0.1 + subTotal
                            });
                            staffPackage.markModified('sendInvoice');
                            staffPackage._editUser = req.user;
                            staffPackage.save(function(err, saved) {
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
    }
    else if (packageType == 'material'){
        Variation.findById(req.params.id, function(err, variation) {
            if (err) {return res.send(500,err);}
            else {
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
                            variation.invoices.push({
                                owner: req.user._id,
                                title: req.body.invoice.title,
                                quoteRate: quoteRate,
                                quotePrice: quotePrice,
                                subTotal: subTotal,
                                total: subTotal * 0.1 + subTotal
                            });
                            variation.markModified('sendInvoice');
                            variation._editUser = req.user;
                            variation.save(function(err, saved) {
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
    }
    else {
        return res.send(500);
    }
};  

exports.sendAddendum = function(req, res) {
    var packageType = req.body.packageType;
    if (packageType == 'contractor') {
        ContractorPackage.findById(req.body.id, function(err, contractorPackage) {
            if (err) {return res.send(500,err)}
            if (!contractorPackage) {return res.send(404,err)}
            else {
                var addendumsScope = [];
                _.each(req.body.addendumScope, function(addendumScope) {
                    addendumsScope.push({
                        description: addendumScope.scopeDescription,
                        quantity: addendumScope.quantity
                    });
                });
                contractorPackage.addendums.push({
                    description: req.body.description.description,
                    addendumsScope: addendumsScope
                });
                contractorPackage.markModified('sendAddendum');
                contractorPackage._editUser = req.user;
                contractorPackage.save(function(err, saved){
                    if (err) {return res.send(500, err);}
                    else {
                        return res.json(200,saved);
                    }
                });
            }
        });
    }
    else if(packageType == 'material') {
        MaterialPackage.findById(req.body.id, function(err, materialPackage) {
            if (err) {return res.send(500,err)}
            if (!materialPackage) {return res.send(404,err)}
            else {
                var addendumsScope = [];
                _.each(req.body.addendumScope, function(addendumScope) {
                    addendumsScope.push({
                        description: addendumScope.scopeDescription,
                        quantity: addendumScope.quantity
                    });
                });
                materialPackage.addendums.push({
                    description: req.body.description.description,
                    addendumsScope: addendumsScope
                });
                materialPackage.markModified('sendAddendum');
                materialPackage._editUser = req.user;
                materialPackage.save(function(err, saved){
                    if (err) {return res.send(500, err);}
                    else {
                        return res.json(200,saved);
                    }
                });
            }
        });
    }
    else if(packageType == 'variation') {
        Variation.findById(req.body.id, function(err, variation) {
            if (err) {return res.send(500,err)}
            if (!variation) {return res.send(404,err)}
            else {
                var addendumsScope = [];
                _.each(req.body.addendumScope, function(addendumScope) {
                    addendumsScope.push({
                        description: addendumScope.scopeDescription,
                        quantity: addendumScope.quantity
                    });
                });
                variation.addendums.push({
                    description: req.body.description.description,
                    addendumsScope: addendumsScope
                });
                variation.markModified('sendAddendum');
                variation._editUser = req.user;
                variation.save(function(err, saved){
                    if (err) {return res.send(500, err);}
                    else {
                        return res.json(200,saved);
                    }
                });
            }
        });
    }
    else {
        return res.send(500);
    }
};

exports.removeAddendum = function(req, res){
    var packageType = req.body.packageType;
    if (packageType == 'contractor') {
        ContractorPackage.findById(req.params.id, function(err, contractorPackage){
            if (err) {return res.send(500,err);}
            else {
                var pack = _.findWhere(contractorPackage.addendums, function(id){
                    return id._id.toString() === req.body.addendumId;
                });
                if (pack._id == req.body.addendumId) {
                    pack.isHidden = true;
                    contractorPackage.save(function(err, saved){
                        if (err) {
                            return res.send(500,err);
                        }
                        else {
                            return res.send(200,saved);
                        }
                    });
                }
                else {
                    return res.send(500,err);
                }
            }
        });
    }
    else if(packageType == 'material') {
        MaterialPackage.findById(req.params.id, function(err, materialPackage){
            if (err) {return res.send(500,err);}
            else {
                var pack = _.findWhere(materialPackage.addendums, function(id){
                    return id._id.toString() === req.body.addendumId;
                });
                if (pack._id == req.body.addendumId) {
                    pack.isHidden = true;
                    materialPackage.save(function(err, saved){
                        if (err) {
                            return res.send(500,err);
                        }
                        else {
                            return res.send(200,saved);
                        }
                    });
                }
                else {
                    return res.send(500,err);
                }
            }
        });
    }
    else {
        return res.send(500);
    }
};

exports.editAddendum = function(req, res) {
    var packageType = req.body.packageType;
    if (packageType == 'contractor') {
        ContractorPackage.findById(req.params.id, function(err, contractorPackage){
            if (err) {return res.send(500,err);}
            else {
                var pack = _.findWhere(contractorPackage.addendums, function(id){
                    return id._id.toString() === req.body.addendumId;
                });
                if (pack._id == req.body.addendumId) {
                    if (pack.description != req.body.addendum.description &&
                        req.body.addendum.description != '{{addendum.description}}') {
                        pack.description = req.body.addendum.description;
                    }
                    else {
                        pack.description = pack.description;
                    }
                    _.each(pack.addendumsScope, function(addendumScope) {
                        _.forEach(req.body.addendum.scopeDescription, function(value, key){
                            if (addendumScope.description != value
                                && value != '{{addendumScope.description}}') {
                                addendumScope.description = value;
                            }
                            else {
                                addendumScope.description = addendumScope.description;   
                            }
                        });
                        _.forEach(req.body.addendum.quantity, function(value,key){
                            if (addendumScope.quantity != value
                                && value != '{{addendumScope.quantity}}') {
                                addendumScope.quantity = value;
                            }
                            else {
                                addendumScope.quantity = addendumScope.quantity;   
                            }
                        });
                        contractorPackage.save();
                    });
                    contractorPackage.markModified('editAddendum');
                    contractorPackage._editUser = req.user;
                    contractorPackage.save(function(err, saved) {
                        if (err) {return res.send(500,err);}
                        else {
                            return res.json(200,saved);
                        }
                    });
                }
                else {
                    return res.send(500);
                }
            }
        });
    }
    else if(packageType == 'material') {
        MaterialPackage.findById(req.params.id, function(err, materialPackage){
            if (err) {return res.send(500,err);}
            else {
                var pack = _.findWhere(materialPackage.addendums, function(id){
                    return id._id.toString() === req.body.addendumId;
                });
                if (pack._id == req.body.addendumId) {
                    if (pack.description != req.body.addendum.description &&
                        req.body.addendum.description != '{{addendum.description}}') {
                        pack.description = req.body.addendum.description;
                    }
                    else {
                        pack.description = pack.description;
                    }
                    _.each(pack.addendumsScope, function(addendumScope) {
                        _.forEach(req.body.addendum.scopeDescription, function(value, key){
                            if (addendumScope.description != value
                                && value != '{{addendumScope.description}}') {
                                addendumScope.description = value;
                            }
                            else {
                                addendumScope.description = addendumScope.description;   
                            }
                        });
                        _.forEach(req.body.addendum.quantity, function(value,key){
                            if (addendumScope.quantity != value
                                && value != '{{addendumScope.quantity}}') {
                                addendumScope.quantity = value;
                            }
                            else {
                                addendumScope.quantity = addendumScope.quantity;   
                            }
                        });
                        materialPackage.save();
                    });
                    materialPackage.markModified('editAddendum');
                    materialPackage._editUser = req.user;
                    materialPackage.save(function(err, saved) {
                        if (err) {return res.send(500,err);}
                        else {
                            return res.json(200,saved);
                        }
                    });
                }
                else {
                    return res.send(500);
                }
            }
        });
    }
    else {
        return res.send(500);
    }
};