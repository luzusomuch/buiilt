'use strict';

var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var File = require('./../../models/file.model');
var Document = require('./../../models/document.model');
var errorsHelper = require('../../components/helpers/errors');
var formidable = require('formidable');
var mkdirp = require('mkdirp');
var path = require('path');
var s3 = require('../../components/S3');
var _ = require('lodash');
var async = require('async');
var gm = require('gm');

var validationError = function (res, err) {
  return res.json(422, err);
};

/**
 * upload
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */
exports.upload = function(req, res){
    // var root = path.normalize(__dirname + '/../../..');
    var form = new formidable.IncomingForm();
    var files = [];
    var uploadedFile = null;
    var uploadDir = "./client/media/files";
    var usersRelatedTo;
    var uploadedField = null;
    mkdirp(uploadDir, function(err) {
        if (err) {console.log(err);}
    });
    form.uploadDir = uploadDir;
    form.keepExtensions = true;
    form.parse(req, function(err, fields, files) {
        if (err) {console.log(err);}
        uploadedField = fields;
    });
    
    form.on('file', function (field, file) {
        if (field === 'file') {
            uploadedFile = file;
            files.push([field, file]);
        }
    })
    .on('end', function() {
        if (uploadedFile && uploadedField) {
            console.log(uploadedFile, uploadedField);
            if (uploadedField._id != 'undefined') {
                File.findById(uploadedField._id, function(err, file) {
                    if (err) {console.log(err);}
                    file.title = uploadedFile.name;
                    file.path = uploadedFile.path;
                    file.mimeType = uploadedFile.type;
                    file.description = uploadedField.description;
                    file.size = uploadedFile.size;
                    file.version = file.version + 1;
                    file.belongTo = req.params.id;
                    file.save(function(err, saved) {
                        if (err) {console.log(err);}
                        else {
                            s3.uploadFile(saved, function(err, data) {
                                if (err) {console.log(err);}
                                else {
                                    if (saved.mimeType == 'image/png' || saved.mimeType == 'image/jpeg') {
                                        gm(__dirname + "/../../../" + fileSaved.path)
                                        .resize(320, 480)
                                        .write(__dirname + "/../../../" + "client/media/files/"+fileSaved._id + '-' +fileSaved.title, function(err) {
                                            if (err) {console.log(err);}
                                            else {
                                                return res.json(200,data);        
                                            }
                                        });
                                    }
                                    else {
                                        return res.json(200,data);
                                    }
                                }
                            });
                        }
                    });
                });
            }
            else {
                var file = new File({
                    title: uploadedFile.name,
                    path: uploadedFile.path,
                    server: 's3',
                    mimeType: uploadedFile.type,
                    description: uploadedField.desc,
                    size: uploadedFile.size,
                    user: req.user._id,
                    belongTo: req.params.id
                });
                file.save(function(err, saved){
                    file.save(function(err, fileSaved) {
                        if (err) {console.log(err);}
                        else {
                            s3.uploadFile(fileSaved, function(err, data) {
                                if (err) {console.log(err);}
                                else {
                                    if (fileSaved.mimeType == 'image/png' || fileSaved.mimeType == 'image/jpeg') {
                                        gm(__dirname + "/../../../" + fileSaved.path)
                                        .resize(320, 480)
                                        .write(__dirname + "/../../../" + "client/media/files/"+fileSaved._id + '-' +fileSaved.title, function(err) {
                                            if (err) {console.log(err);}
                                            else
                                                return res.json(200,data);        
                                        });
                                    }
                                    else {
                                        return res.json(200,data);  
                                    }
                                }
                            })
                        }
                    });
                });
            }
        }
    })
};


exports.uploadInPackge = function(req, res){
    // var root = path.normalize(__dirname + '/../../..');
    var form = new formidable.IncomingForm();
    var files = [];
    var uploadedFile = null;
    var uploadDir = "./client/media/files";
    var uploadedField = null;
    mkdirp(uploadDir, function(err) {
        if (err) {console.log(err);}
    });
    form.uploadDir = uploadDir;
    form.keepExtensions = true;
    form.parse(req, function(err, fields, files) {
        if (err) {console.log(err);}
        uploadedField = fields;
    });
    
    form.on('file', function (field, file) {
        if (field === 'file') {
            uploadedFile = file;
            files.push([field, file]);
        }
    })
    .on('end', function() {
        if (uploadedFile && uploadedField) {
            console.log(uploadedFile, uploadedField);
            if (uploadedField._id != 'undefined') {
                File.findById(uploadedField._id, function(err, file) {
                    if (err) {console.log(err);}
                    file.title = uploadedFile.name;
                    file.path = uploadedFile.path;
                    file.mimeType = uploadedFile.type;
                    file.description = uploadedField.description;
                    file.size = uploadedFile.size;
                    file.version = file.version + 1;
                    file.belongTo = req.params.id;
                    file.save(function(err, saved) {
                        if (err) {console.log(err);}
                        else {
                            s3.uploadFile(saved, function(err, data) {
                                if (err) {console.log(err);}
                                else {
                                    if (saved.mimeType == 'image/png' || saved.mimeType == 'image/jpeg') {
                                        gm(__dirname + "/../../../" + fileSaved.path)
                                        .resize(320, 480)
                                        .write(__dirname + "/../../../" + "client/media/files/"+fileSaved._id + '-' +fileSaved.title, function(err) {
                                            if (err) {console.log(err);}
                                            else {
                                                return res.json(200,data);        
                                            }
                                        });
                                    }
                                    else {
                                        return res.json(200,data);
                                    }
                                }
                            })
                        }
                    });  
                });
            }
            else {
                var file = new File({
                    title: uploadedFile.name,
                    path: uploadedFile.path,
                    server: 's3',
                    mimeType: uploadedFile.type,
                    description: uploadedField.desc,
                    size: uploadedFile.size,
                    user: req.user._id,
                    belongTo: req.params.id
                });
                file.save(function(err, fileSaved) {
                    if (err) {console.log(err);}
                    else {
                        s3.uploadFile(fileSaved, function(err, data) {
                            if (err) {console.log(err);}
                            else {
                                if (fileSaved.mimeType == 'image/png' || fileSaved.mimeType == 'image/jpeg') {
                                    gm(__dirname + "/../../../" + fileSaved.path)
                                    .resize(320, 480)
                                    .write(__dirname + "/../../../" + "client/media/files/"+fileSaved._id + '-' +fileSaved.title, function(err) {
                                        if (err) {console.log(err);}
                                        else
                                            return res.json(200,data);        
                                    });
                                }
                                else {
                                    return res.json(200,data);  
                                }
                            }
                        })
                    }
                });
            }
        }
    })
};