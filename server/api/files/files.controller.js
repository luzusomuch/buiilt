'use strict';
var User = require('./../../models/user.model');
var File = require('./../../models/file.model');
var Notification = require('./../../models/notification.model');
var errorsHelper = require('../../components/helpers/errors');
var ProjectValidator = require('./../../validators/project');
var _ = require('lodash');
var async = require('async');
var s3 = require('../../components/S3');
var mongoose = require('mongoose');

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
    File.findById(req.body.id, function(err, file) {
        if (err) {return res.send(500, err);}
        else {
            if (req.body.isInterested == true) {
                _.remove(file.usersInterestedIn, {_id: req.user._id});
            }
            else {
                file.usersInterestedIn.push({_id: req.user._id});
            }
            file.markModified('usersInterestedIn');
            file.save(function(err, savedFile) {
                if (err) {return res.send(500, err);}
                else {
                    return res.json(savedFile);
                }
            });
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

exports.getFileByStateParamIos = function(req, res) {
    var result = [];
    File.find({'belongTo': req.params.id}, function(err, files) {
        if (err) {return res.send(500,err)}
        else {
            async.each(files, function(file, cb){
                var query = Notification.find(
                    {owner : req.user._id,unread : true, type : 'uploadNewDocumentVersion','element.file._id' : file._id }
                );
                query.distinct('element.file._id');

                query.exec(function(err, fileNotifications) {
                    if (err) {return cb(err);}
                    if (fileNotifications.length > 0) {
                        _.each(fileNotifications, function(fileNotification){
                            if (file._id.toString() == fileNotification.toString()) {
                                file.isNewNotification = true;
                                result.push(file);
                                cb();
                            }
                        });
                    }
                    else {
                        result.push(file);
                        cb()
                    }
                });
            }, function(err){
                if (err) {return res.send(500,err);}
                return res.json(200,result);
            });
        }
    });
};

exports.downloadFile = function(req, res) {
    File.findById(req.params.id, function(err, file){
        if (err) {return res.send(500,err);}
        else {
            var fileUrl = {url: s3.getPublicUrl(file.name)};
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

exports.downloadAll = function(req, res) {
    File.find({belongTo:req.params.id}, function(err, files){
        if (err) {return res.send(500,err);}
        else {
            var listFileUrls = [];
            _.each(files, function(file){
                var fileUrl = {url: s3.getPublicUrl(file.name)};    
                listFileUrls.push(fileUrl);
            });
            return res.json(200,listFileUrls);
            
            // return res.json(200,fileUrl);
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

exports.getAll = function(req, res) {
    File.find({}, function(err, files){
        if (err) {return res.send(500,err);}
        return res.json(200,files)
    })
};

exports.getFileByPackage = function(req, res) {
    File.find({belongTo: req.params.id, belongToType: req.params.type}, function(err, files){
        if (err) {return res.send(500,err);}
        if (!files) {return res.send(404);}
        return res.send(200,files);
    });
};

exports.deleteFile = function(req, res) {
    File.findByIdAndRemove(req.params.id, function(err, file) {
        if (err) {return res.send(500,err);}
        return res.send(200);
    });
};

exports.sendToDocument = function(req, res) {
    File.findById(req.params.id, function(err, file){
        if (err) {return res.send(500,err);}
        if (!file) {return res.send(404);}
        File.findOne({belongTo: req.body.projectId, isSendToDocumentation: true, wasBelongTo: req.body.package}, function(err, _file){
            if (err) {return res.send(500,err);}
            if (!_file) {
                var newFile = new File({
                    documentDesignId: mongoose.Types.ObjectId(file._id.toString()),
                    wasBelongTo: file.belongTo,
                    isSendToDocumentation: true,
                    belongTo: req.body.projectId,
                    belongToType: file.belongToType,
                    size: file.size,
                    description: file.description,
                    mimeType: file.mimeType,
                    path: file.path,
                    user: file.user,
                    server: file.server,
                    name: file.name,
                    title: file.title,
                    isQuote: file.isQuote,
                    tags: file.tags,
                    usersInterestedIn: file.usersInterestedIn,
                    usersRelatedTo: file.usersInterestedIn,
                    version: 0
                });
                newFile.save(function(err){
                    if (err) {console.log(err);return res.send(500,err);}
                    return res.send(200, newFile);
                });
            } else {
                _file.documentDesignId = mongoose.Types.ObjectId(file._id.toString());
                _file.wasBelongTo = file.belongTo;
                _file.isSendToDocumentation = true;
                _file.belongTo = req.body.projectId;
                _file.belongToType = file.belongToType;
                _file.size = file.size;
                _file.description = file.description;
                _file.mimeType = file.mimeType;
                _file.path = file.path;
                _file.user = file.user;
                _file.server = file.server;
                _file.name = file.name;
                _file.title = file.title;
                _file.isQuote = file.isQuote;
                _file.tags = file.tags;
                _file.usersInterestedIn = file.usersInterestedIn;
                _file.usersRelatedTo = file.usersInterestedIn;
                _file.version = file.version + 1;

                _file.save(function(err){
                    if (err) {return res.send(500,err);}
                    return res.send(200,_file);
                });
            }
        });
    });
};