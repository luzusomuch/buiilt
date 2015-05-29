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
 * create a new project
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */
exports.upload = function(req, res){
    var root = path.normalize(__dirname + '/../../..');
    var form = new formidable.IncomingForm();
    var files = [];
    var uploadedFile = null;
    var uploadDir = root + "/client/media/file";
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
    // .on('field', function (field, value) {
    //     console.log(field, value);
    //     console.log('field');
    //     if (field === 'usersRelatedTo') {
    //         usersRelatedTo = value;
    //     }
    //     console.log(usersRelatedTo);
    // })
    .on('end', function() {
        if (uploadedFile && uploadedField) {
            var file = new File({
                title: uploadedFile.name,
                path: uploadedFile.path,
                server: 's3',
                mimeType: uploadedFile.type,
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
                                var document = new Document({
                                    user: req.user._id,
                                    project: req.params.id,
                                    package: builderPackage._id,
                                    description: uploadedField.desc,
                                    file: fileSaved._id
                                });
                                document.save(function(err, documentSaved) {
                                    if (err) {console.log(err);}
                                    else {
                                        // return res.json(documentSaved);
                                        s3.uploadFile(file, function(err, data) {
                                            if (err) {return validationError(res, err); };
                                            return res.json(data);
                                        });
                                    }
                                });
                            });
                        }
                    });
                }
            }); 
        }
    });
        
    // .on('field', function (field, value) {
    //   console.log(field, value);
    // })
    // .on('error', function(err){
    //     console.log(err);
    // });
//     ImageUpload.upload(req, function(err, data){
//       if(err){ return res.status(400).json('There are problem in the server, please try again.'); }
//       console.log('Data');
//       //console.log(data.fields.tags);
//       var tags = JSON.parse(data.fields.tags);
//       console.log(tags);
//       //store this data to db
//       var file = new File({
//         title: data.fields.title,
//         description: data.fields.desc || '',
//         tags: tags,
//         server: 'cloudinary',
//         path: data.cloudinary.public_id,
//         _serverData: data.cloudinary,
//         type: 'image',
//         profile: profile._id,
//         date: data.fields.date ? (new Date(data.fields.date)).getTime() : (new Date()).getTime(),
// //        album: data.fields.album
//         //user
//       });

//       media.save(function(err, savedMedia){
//         return res.json({
//           status: err ? 'fail' : 'success',
//           url: err ? null : savedMedia.image,
//           data: savedMedia
//         });
//       });
//     });
};


