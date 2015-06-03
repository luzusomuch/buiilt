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
            var file = new File({
                title: uploadedFile.name,
                path: uploadedFile.path,
                server: 's3',
                mimeType: uploadedFile.type,
                description: uploadedField.desc,
                size: uploadedFile.size,
                user: req.user._id
            });

            uploadedField.usersRelatedTo = uploadedField.usersRelatedTo.split(',');
            async.each(uploadedField.usersRelatedTo, function(userRelated, callback) {
                User.findOne({'email': userRelated}, function(err, user) {
                    if (user) {
                        file.usersRelatedTo.push({
                            _id: user._id,
                            email: user.email
                        });
                        //calbacl
                        callback();
                    }
                });
                
            }, function(err) {
                if (err) {console.log(err);}
                else {
                    file.save(function(err, fileSaved) {
                        if (err) {console.log(err);}
                        else {
                            BuilderPackage.findOne({'project':req.params.id}, function(err, builderPackage) {
                                if (err) {console.log(err);}
                                else {
                                    Document.findById(uploadedField.doc, function(err, doc) {
                                        if (err) {console.log(err);}
                                        else {
                                            doc.file.push({
                                                _id: fileSaved._id
                                            });
                                            doc.version = doc.version + 1;
                                            doc.save(function(err, documentSaved){
                                                if (err) {console.log(err);}
                                                else {
                                                    s3.uploadFile(fileSaved, function(err,data) {
                                                        if (err) {console.log(err);}
                                                        else {
                                                            return res.json(200,data);
                                                        }
                                                    })
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            }); 
        }
    });
        
};


