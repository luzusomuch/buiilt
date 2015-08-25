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
    else if (packageType == 'builder' || packageType == 'BuilderPackage') {
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
    else if (packageType == 'staff') {
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
    console.log(packageType);
    if (!req.body.quoteLater && req.body.quoteLater == false) {
        var quoteRate = [];
        var quotePrice = [];
        var subTotal = 0;
        if (req.body.rate) {
            _.each(req.body.rate, function(rate) {
                if (rate) {
                    for (var i = 0; i < req.body.rate.length -1; i++) {
                        quoteRate.push({
                            description: rate.description[i],
                            rate: rate.rate[i],
                            quantity: rate.quantity[i],
                            total: rate.rate[i] * rate.quantity[i]
                        });
                        subTotal += parseFloat(rate.rate[i] * rate.quantity[i]);
                    };
                }
            });
        }
        if (req.body.price) {
            _.each(req.body.price, function(price) {
                if (price) {
                    for (var i = 0; i < req.body.price.length -1; i++) {
                        quotePrice.push({
                            description: price.description[i],
                            price: price.price[i],
                            quantity: 1,
                            total: price.price[i]
                        });
                        subTotal += parseFloat(price.price[i]);
                    };
                }
            });
        }
        if (packageType == 'contractor') {
            ContractorPackage.findById(req.params.id, function(err, contractorPackage){
                if (err) {return res.send(500,err);}
                else {
                    var quoteRequest = new QuoteRequest({
                        user: req.user._id,
                        team: req.user.team._id,
                        description: req.body.variation.descriptions,
                        project: contractorPackage.project,
                        type: 'contractor to builder',
                        package: req.params.id,
                        packageType: 'contractor',
                        quoteRate: (quoteRate) ? quoteRate : null,
                        quotePrice: (quotePrice) ? quotePrice : null,
                        subTotal: subTotal,
                        total: subTotal * 0.1 + subTotal
                    });
                    quoteRequest.save(function(err, saved){
                        if (err) {return res.send(500,err);}
                        var variation = new Variation({
                            owner: contractorPackage.owner,
                            project: contractorPackage.project,
                            package: contractorPackage._id,
                            name: req.body.variation.title,
                            description: req.body.variation.descriptions,
                            packageType: packageType,
                            type: 'variation',
                            'to._id': contractorPackage.winnerTeam._id,
                            'to.quote': saved._id
                        });
                        _.each(req.body.variation.descriptions, function(description){
                            variation.addendums.push({
                                'addendumsScope.description': description
                            }); 
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
                    });
                }
            });
        }
        else if (packageType == 'material') {
            MaterialPackage.findById(req.params.id, function(err, materialPackage){
                if (err) {return res.send(500,err);}
                else {
                    var quoteRequest = new QuoteRequest({
                        user: req.user._id,
                        team: req.user.team._id,
                        description: req.body.variation.descriptions,
                        project: materialPackage.project,
                        type: 'supplier to builder',
                        package: req.params.id,
                        packageType: 'supplier',
                        quoteRate: (quoteRate) ? quoteRate : null,
                        quotePrice: (quotePrice) ? quotePrice : null,
                        subTotal: subTotal,
                        total: subTotal * 0.1 + subTotal
                    });
                    quoteRequest.save(function(err, saved){
                        if (err) {return res.send(500,err);}
                        var variation = new Variation({
                            owner: materialPackage.owner,
                            project: materialPackage.project,
                            package: materialPackage._id,
                            name: req.body.variation.title,
                            description: req.body.variation.descriptions,
                            packageType: packageType,
                            type: 'variation',
                            'to._id': materialPackage.winnerTeam._id,
                            'to.quote': saved._id
                        });
                        _.each(req.body.variation.descriptions, function(description){
                            variation.addendums.push({
                                'addendumsScope.description': description
                            }); 
                        });
                        variation.save(function(err,saved){
                            if (err) {return res.send(500,err);}
                            materialPackage.variations.push(saved._id);
                            materialPackage.markModified('sendVariation');
                            materialPackage._editUser = req.user;
                            materialPackage.save(function(err, savedMaterialPackage){
                                if (err) {return res.send(500,err);}
                                else {
                                    return res.json(saved);
                                }
                            });
                        });
                    });
                }
            });
        }
        else if (packageType == 'builder' || packageType == 'BuilderPackage') {
            BuilderPackage.findById(req.params.id, function(err, builderPackage){
                if (err) {return res.send(500,err);}
                else {
                    var quoteRequest = new QuoteRequest({
                        user: req.user._id,
                        team: req.user.team._id,
                        description: req.body.variation.descriptions,
                        project: builderPackage.project,
                        type: 'builder to homeowner',
                        package: req.params.id,
                        packageType: 'builder',
                        quoteRate: (quoteRate) ? quoteRate : null,
                        quotePrice: (quotePrice) ? quotePrice : null,
                        subTotal: subTotal,
                        total: subTotal * 0.1 + subTotal
                    });
                    quoteRequest.save(function(err, saved){
                        if (err) {return res.send(500,err);}
                        var variation = new Variation({
                            owner: (builderPackage.to.team) ? builderPackage.to.team : null,
                            project: builderPackage.project,
                            package: builderPackage._id,
                            name: req.body.variation.title,
                            description: req.body.variation.descriptions,
                            packageType: packageType,
                            type: 'variation',
                            'to._id': builderPackage.owner,
                            'to.quote': saved._id
                        });
                        _.each(req.body.variation.descriptions, function(description){
                            variation.addendums.push({
                                'addendumsScope.description': description
                            }); 
                        });
                        variation.save(function(err,saved){
                            if (err) {return res.send(500,err);}
                            builderPackage.variations.push(saved._id);
                            builderPackage.markModified('sendVariation');
                            builderPackage._editUser = req.user;
                            builderPackage.save(function(err, savedBuilderPackage){
                                if (err) {return res.send(500,err);}
                                else {
                                    return res.json(saved);
                                }
                            });
                        });
                    });
                }
            });
        }
        else {
            return res.send(500);
        }
    }
    else {
        if (packageType == 'contractor') {
            ContractorPackage.findById(req.params.id, function(err, contractorPackage){
                if (err) {return res.send(500,err);}
                else {
                    var variation = new Variation({
                        owner: contractorPackage.owner,
                        project: contractorPackage.project,
                        package: contractorPackage._id,
                        name: req.body.variation.title,
                        description: req.body.variation.descriptions,
                        packageType: packageType,
                        type: 'variation',
                        'to._id': contractorPackage.winnerTeam._id
                    });
                    _.each(req.body.variation.descriptions, function(description){
                        variation.addendums.push({
                            'addendumsScope.description': description
                        }); 
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
                    var variation = new Variation({
                        owner: materialPackage.owner,
                        project: materialPackage.project,
                        package: materialPackage._id,
                        name: req.body.variation.title,
                        description: req.body.variation.descriptions,
                        packageType: packageType,
                        type: 'variation',
                        'to._id': materialPackage.winnerTeam._id
                    });
                    _.each(req.body.variation.descriptions, function(description){
                        variation.addendums.push({
                            'addendumsScope.description': description
                        }); 
                    });
                    variation.save(function(err,saved){
                        if (err) {return res.send(500,err);}
                        materialPackage.variations.push(saved._id);
                        materialPackage.markModified('sendVariation');
                        materialPackage._editUser = req.user;
                        materialPackage.save(function(err, savedMaterialPacakge){
                            if (err) {return res.send(500,err);}
                            else {
                                return res.json(saved);
                            }
                        });
                    });
                }
            });
        }
        else if (packageType == 'builder' || packageType == 'BuilderPackage') {
            BuilderPackage.findById(req.params.id, function(err, builderPackage){
                if (err) {return res.send(500,err);}
                else {
                    var variation = new Variation({
                        owner: (builderPackage.to.team) ? builderPackage.to.team : null,
                        project: builderPackage.project,
                        package: builderPackage._id,
                        name: req.body.variation.title,
                        description: req.body.variation.descriptions,
                        packageType: packageType,
                        type: 'variation',
                        'to._id': builderPackage.owner
                    });
                    _.each(req.body.variation.descriptions, function(description){
                        variation.addendums.push({
                            'addendumsScope.description': description
                        }); 
                    });
                    variation.save(function(err,saved){
                        if (err) {return res.send(500,err);}
                        builderPackage.variations.push(saved._id);
                        builderPackage.markModified('sendVariation');
                        builderPackage._editUser = req.user;
                        builderPackage.save(function(err, savedBuilderPacakge){
                            if (err) {return res.send(500,err);}
                            else {
                                return res.json(saved);
                            }
                        });
                    });
                }
            });
        }
        else {
            return res.send(500);
        }
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
    else if (packageType == 'builder' || packageType == 'BuilderPackage'){
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
    else if (packageType == 'staff'){
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
    else if (packageType == 'variation'){
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
                _.each(req.body.addendumScope, function(addendumScope){
                    contractorPackage.addendums.push({
                        'addendumsScope.description': addendumScope.scopeDescription
                    }); 
                });
                contractorPackage.markModified('sendAddendum');
                contractorPackage._editUser = req.user;
                contractorPackage.save(function(err, saved){
                    if (err) {return res.send(500, err);}
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
    else if(packageType == 'material') {
        MaterialPackage.findById(req.body.id, function(err, materialPackage) {
            if (err) {return res.send(500,err)}
            if (!materialPackage) {return res.send(404,err)}
            else {
                _.each(req.body.addendumScope, function(addendumScope) {
                    materialPackage.addendums.push({
                        'addendumsScope.description': addendumScope.scopeDescription,
                        'addendumsScope.quantity': addendumScope.quantity,
                    });  
                });
                materialPackage.markModified('sendAddendum');
                materialPackage._editUser = req.user;
                materialPackage.save(function(err, saved){
                    if (err) {return res.send(500, err);}
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
    else if(packageType == 'variation') {
        Variation.findById(req.body.id, function(err, variation) {
            if (err) {return res.send(500,err)}
            if (!variation) {return res.send(404,err)}
            else {
                var addendumsScope = [];
                _.each(req.body.addendumScope, function(addendumScope) {
                    variation.addendums.push({
                        'addendumsScope.description': addendumScope.scopeDescription,
                        'addendumsScope.quantity': addendumScope.quantity
                    });
                });
                
                variation.markModified('sendAddendum');
                variation._editUser = req.user;
                variation.save(function(err, saved){
                    if (err) {return res.send(500, err);}
                    else {
                        Variation.populate(saved, [{path: 'to._id'},{path: 'to.quote'}], function(err,variation){
                            if (err) {return res.send(500,err);}
                            else {
                                return res.json(200,saved);
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
    else if(packageType == 'variation') {
        Variation.findById(req.params.id, function(err, variation){
            if (err) {return res.send(500,err);}
            else {
                var pack = _.findWhere(variation.addendums, function(id){
                    return id._id.toString() === req.body.addendumId;
                });
                if (pack._id == req.body.addendumId) {
                    pack.isHidden = true;
                    variation.save(function(err, saved){
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

function compare(a,b) {
  if (a.updated < b.updated)
    return -1;
  if (a.updated > b.updated)
    return 1;
  return 0;
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
                    if (pack._id == req.body.addendumId) {
                        if (pack.addendumsScope.description != req.body.addendum.scopeDescription && 
                            req.body.addendum.scopeDescription != '{{addendum.addendumsScope.description}}') {
                            pack.addendumsScope.description = req.body.addendum.scopeDescription;
                        }
                        else if(req.body.addendum.scopeDescription == '{{addendum.addendumsScope.description}}'){
                            pack.addendumsScope.description = pack.addendumsScope.description;
                        }
                        else {
                            pack.addendumsScope.description = pack.addendumsScope.description;
                        }
                        contractorPackage.markModified('editAddendum');
                        contractorPackage._editUser = req.user;
                        contractorPackage.save(function(err, saved) {
                            if (err) {return res.send(500,err);}
                            else {
                                saved.populate('to.quote', function(err){
                                    if (err) {return res.send(500,err);}
                                    return res.json(200,saved);
                                });
                            }
                        });
                    }
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
                    if (pack.addendumsScope.description != req.body.addendum.scopeDescription && 
                        req.body.addendum.scopeDescription != '{{addendum.addendumsScope.description}}') {
                        pack.addendumsScope.description = req.body.addendum.scopeDescription;
                    }
                    else if(req.body.addendum.scopeDescription == '{{addendum.addendumsScope.description}}'){
                        pack.addendumsScope.description = pack.addendumsScope.description;
                    }
                    else {
                        pack.addendumsScope.description = pack.addendumsScope.description;
                    }
                    if (pack.addendumsScope.quantity != req.body.addendum.quantity && 
                        req.body.addendum.quantity != '{{addendum.addendumsScope.quantity}}') {
                        pack.addendumsScope.quantity = req.body.addendum.quantity;
                    }
                    else if(req.body.addendum.quantity == '{{addendum.addendumsScope.quantity}}'){
                        pack.addendumsScope.quantity = pack.addendumsScope.quantity;
                    }
                    else {
                        pack.addendumsScope.quantity = pack.addendumsScope.quantity;
                    }
                }
                materialPackage.markModified('editAddendum');
                materialPackage._editUser = req.user;
                materialPackage.save(function(err, saved) {
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
    else if(packageType == 'variation') {
        Variation.findById(req.params.id, function(err, variation){
            if (err) {return res.send(500,err);}
            else {
                if (variation.packageType == 'contractor' || variation.packageType == 'BuilderPackage') {
                    var pack = _.findWhere(variation.addendums, function(id){
                        return id._id.toString() === req.body.addendumId;
                    });
                    if (pack._id == req.body.addendumId) {
                        if (pack._id == req.body.addendumId) {
                            if (pack.addendumsScope.description != req.body.addendum.scopeDescription && 
                                req.body.addendum.scopeDescription != '{{addendum.addendumsScope.description}}') {
                                pack.addendumsScope.description = req.body.addendum.scopeDescription;
                            }
                            else if(req.body.addendum.scopeDescription == '{{addendum.addendumsScope.description}}'){
                                pack.addendumsScope.description = pack.addendumsScope.description;
                            }
                            else {
                                pack.addendumsScope.description = pack.addendumsScope.description;
                            }
                            variation.markModified('editAddendum');
                            variation._editUser = req.user;
                            variation.save(function(err, saved) {
                                if (err) {return res.send(500,err);}
                                else {
                                    saved.populate('to.quote', function(err){
                                        if (err) {return res.send(500,err);}
                                        return res.json(200,saved);
                                    });
                                }
                            });
                        }
                    }
                }
                else if (variation.packageType == 'material') {
                    console.log('sdsds');
                    var pack = _.findWhere(variation.addendums, function(id){
                        return id._id.toString() === req.body.addendumId;
                    });
                    if (pack._id == req.body.addendumId) {
                        if (pack.addendumsScope.description != req.body.addendum.scopeDescription && 
                            req.body.addendum.scopeDescription != '{{addendum.addendumsScope.description}}') {
                            pack.addendumsScope.description = req.body.addendum.scopeDescription;
                        }
                        else if(req.body.addendum.scopeDescription == '{{addendum.addendumsScope.description}}'){
                            pack.addendumsScope.description = pack.addendumsScope.description;
                        }
                        else {
                            pack.addendumsScope.description = pack.addendumsScope.description;
                        }
                        if (pack.addendumsScope.quantity != req.body.addendum.quantity && 
                            req.body.addendum.quantity != '{{addendum.addendumsScope.quantity}}') {
                            pack.addendumsScope.quantity = req.body.addendum.quantity;
                        }
                        else if(req.body.addendum.quantity == '{{addendum.addendumsScope.quantity}}'){
                            pack.addendumsScope.quantity = pack.addendumsScope.quantity;
                        }
                        else {
                            pack.addendumsScope.quantity = pack.addendumsScope.quantity;
                        }
                        variation.markModified('editAddendum');
                        variation._editUser = req.user;
                        variation.save(function(err, saved) {
                            if (err) {return res.send(500,err);}
                            else {
                                saved.populate('to.quote', function(err){
                                    if (err) {return res.send(500,err);}
                                    return res.json(200,saved);
                                });
                            }
                        });
                    }
                }
            }
        });
    }
    else {
        return res.send(500);
    }
};