'use strict';
var User = require('./../../models/user.model');
var Document = require('./../../models/document.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var errorsHelper = require('../../components/helpers/errors');
var _ = require('lodash');
var async = require('async');

exports.getByProjectAndPackage = function(req, res) {
    Document.find({package: req.params.id}, function(err, documents) {
        if (err) 
            return res.send(500, err);
        res.json(200, documents);
    });
}

exports.create = function(req, res) {
    BuilderPackage.findOne({project: req.params.id}, function(err, builderPackage) {
        if (err) {return res.send(500, err);}
        else {
            var document = new Document({
                user: req.user._id,
                project: req.params.id,
                package: builderPackage._id,
                name: req.body.name,
                description: req.body.description
            });
            document.save(function(err, savedDocument){
                if (err) {return res.send(500, err);}
                return res.json(200, savedDocument);
            });
        }
    })
}