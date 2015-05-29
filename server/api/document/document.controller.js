'use strict';
var User = require('./../../models/user.model');
var Document = require('./../../models/document.model');
var errorsHelper = require('../../components/helpers/errors');
var _ = require('lodash');
var async = require('async');

exports.getByProjectAndPackage = function(req, res) {
    Document.find({package: req.params.id}, function(err, documents) {
        if (err) 
            return res.send(500, err);
         //console.log(documents);
        res.json(200, documents);
    });
}