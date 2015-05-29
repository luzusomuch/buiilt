'use strict';
var User = require('./../../models/user.model');
var File = require('./../../models/file.model');
var errorsHelper = require('../../components/helpers/errors');
var ProjectValidator = require('./../../validators/project');
var _ = require('lodash');
var async = require('async');

exports.getByDocument = function(req, res) {
    File.find({package: req.params.id}, function(err, files) {
        if (err) 
            return res.send(500, err);
         //console.log(documents);
        res.json(200, files);
    });
};

exports.show = function(req, res) {
    File.findById(req.params.id, function(err, file) {
        if (err) 
            return res.send(500, err);
         //console.log(documents);
        res.json(200, file);
    });
};

exports.interested = function(req, res) {
    console.log(req.params.id);
    File.findById(req.params.id, function(err, file) {
        if (err) {return res.send(500, err);}
        else {
            file.usersInterestedIn = {_id: req.user._id, email: req.user.email};
            file.save(function(err, savedFile) {
                if (err) {return res.send(500, err);}
                else {
                    return res.json(savedFile);
                }
            })
        }
    });
};