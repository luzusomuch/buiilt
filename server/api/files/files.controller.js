'use strict';
var User = require('./../../models/user.model');
var File = require('./../../models/file.model');
var errorsHelper = require('../../components/helpers/errors');
var ProjectValidator = require('./../../validators/project');
var _ = require('lodash');
var async = require('async');
var s3 = require('../../components/S3');

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
        // console.log(file);
        return res.json(file);
    });
};

exports.interested = function(req, res) {
    File.findById(req.params.id, function(err, file) {
        if (err) {return res.send(500, err);}
        else {
            console.log(file);
            file.usersInterestedIn = {_id: req.user._id};
            file.save(function(err, savedFile) {
                if (err) {return res.send(500, err);}
                else {
                    return res.json(savedFile);
                }
            })
        }
    });
};
exports.disinterested = function(req, res) {
    File.findById(req.params.id, function(err, file) {
        if (err) {return res.send(500, err);}
        else {
            if (_.find(file.usersInterestedIn, {_id: req.user._id})) {
                _.remove(file.usersInterestedIn, {_id: req.user._id});
                console.log(file);
                file.save(function(err, savedFile) {
                    if (err) {return res.send(500, err);}
                    else {
                        console.log(savedFile);
                        return res.json(savedFile);
                    }
                })
            }
            else {
                return res.send(500);
            }
        }
    });
};


exports.getFileByStateParam = function(req, res) {
    File.find({'belongTo': req.params.id}, function(err, files) {
        if (err) {return res.send(500,err)}
        else {
            return res.json(200,files);
        }
    });
};

exports.downloadFile = function(req, res) {
    File.findById(req.params.id, function(err, file){
        if (err) {return res.send(500,err);}
        else {
            var fileUrl = {url: s3.getPublicUrl(file.title)};
            return res.json(200,fileUrl);
            // s3.downloadFile(file, function(err, data) {
            //     if (err) {return res.send(500,err);}
            //     else {
            //         console.log(data)
            //         return res.json(200,data);
            //     }
            // });
        }
    });
};