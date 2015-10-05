'use strict';

var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var ContractorPackage = require('./../../models/contractorPackage.model');
var MaterialPackage = require('./../../models/materialPackage.model');
var StaffPackage = require('./../../models/staffPackage.model');
var Variation = require('./../../models/variation.model');
var Design = require('./../../models/design.model');
var File = require('./../../models/file.model');
var Document = require('./../../models/document.model');
var Notification = require('./../../models/notification.model');
var NotificationHelper = require('./../../components/helpers/notification');
var errorsHelper = require('../../components/helpers/errors');
var formidable = require('formidable');
var mkdirp = require('mkdirp');
var path = require('path');
var s3 = require('../../components/S3');
var _ = require('lodash');
var async = require('async');
var gm = require('gm');
var fs = require('fs');
var exec = require('child_process').exec;
var config = require('./../../config/environment');

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
    var request = req.body.file;
    if (request._id != '') {
        File.findById(request._id, function(err, file) {
            if (err) {console.log(err);return res.send(500,err);}
            file.title = request.title;
            file.name = request.file.filename;
            file.path = request.file.url;
            file.server = 's3';
            file.mimeType = request.file.mimetype;
            file.description = request.desc;
            file.size = request.file.size;
            file.version = file.version + 1;
            file.belongTo = req.params.id;
            file.tags = request.tags;
            file.save(function(err, saved) {
                if (err) {console.log(err);return res.send(500,err);}
                var owners = [];
                BuilderPackage.findOne({project: saved.belongTo})
                .populate('owner')
                .populate("project")
                .populate('to.team')
                .populate('member').exec(function(err,builderPackage){
                    if (err) {return res.send(500,err);}
                    owners = builderPackage.owner.leader;
                    _.each(builderPackage.owner.member, function(member){
                        if (member._id) {
                            owners.push(member._id);
                        }
                    });
                    if (builderPackage.to.team) {
                        owners = _.union(owners, builderPackage.to.team.leader);
                        _.each(builderPackage.to.team.member, function(member){
                            if (member._id) {
                                owners.push(member._id);
                            }
                        });
                    } else if (builderPackage.winner) {
                        owners = _.union(owners, builderPackage.winner.leader);
                        _.each(builderPackage.winner.member, function(member){
                            if (member._id) {
                                owners.push(member._id);
                            }
                        });
                    }
                    _.remove(owners, req.user._id);
                    async.each(owners, function(leader, callback){
                        var notification = new Notification({
                            owner: leader,
                            fromUser: req.user._id,
                            toUser: leader,
                            element: {file: saved.toJSON(), 
                                uploadIn: builderPackage,
                                projectId: builderPackage.project},
                            referenceTo: "DocumentInProject",
                            type: 'uploadNewDocumentVersion'
                        });
                        notification.save(callback);
                    }, function(err){
                        if (err) {return res.send(500,err);}
                        return res.send(file.toJSON());
                    });
                });
            });
        });
    } else {
        var file = new File({
            title: request.title,
            name: request.file.filename,
            path: request.file.url,
            key: request.file.key,
            server: 's3',
            mimeType: request.file.mimeType,
            description: request.desc,
            size: request.file.size,
            user: req.user._id,
            belongTo: req.params.id,
            tags: request.tags
        });
        file.save(function(err){
            if (err) {console.log(err);return res.send(500,err);}
            var owners = [];
            BuilderPackage.findOne({project: file.belongTo})
            .populate('owner')
            .populate("project")
            .populate('to.team')
            .populate('winner').exec(function(err,builderPackage){
                if (err || !builderPackage) {return cb(err);}
                else {
                    owners = builderPackage.owner.leader;
                    _.each(builderPackage.owner.member, function(member){
                        if (member._id) {
                            owners.push(member._id);
                        }
                    });
                    if (builderPackage.to.team) {
                        owners = _.union(builderPackage.owner.leader, builderPackage.to.team.leader);
                        _.each(builderPackage.to.team.member, function(member){
                            if (member._id) {
                                owners.push(member._id);
                            }
                        });
                    } else if (builderPackage.winner) {
                        owners = _.union(owners, builderPackage.winner.leader);
                        _.each(builderPackage.winner.member, function(member){
                            if (member._id) {
                                owners.push(member._id);
                            }
                        });
                    }
                    _.remove(owners, req.user._id);
                    async.each(owners, function(leader, callback){
                        var notification = new Notification({
                            owner: leader,
                            fromUser: req.user._id,
                            toUser: leader,
                            element: {file: file.toJSON(), 
                                uploadIn: builderPackage,
                                projectId: builderPackage.project},
                            referenceTo: "DocumentInProject",
                            type: 'uploadNewDocumentVersion'
                        });
                        notification.save(callback);
                    }, function(err) {
                        if (err) {return res.send(500,err);}
                        return res.send(file.toJSON());
                    });
                }
            });
        });
    }
};

exports.uploadInPackge = function(req, res){ 
    var request = req.body.file;
    var file = new File();
    file.title = (request.title == 'undefined') ? request.file.filename : request.title;
    file.name = request.file.filename;
    file.server = 's3';
    file.user = req.user._id;
    file.path = request.file.url;
    file.key = request.file.key,
    file.mimeType = request.file.mimetype;
    file.description = request.desc;
    file.size = request.file.size;
    file.version = file.version;
    file.belongTo = req.params.id;
    file.belongToType = request.belongToType;
    file.uploadBy = req.user.team._id;
    file.tags = request.tags;
    file.isQuote = request.isQuote;
    file.save(function(err) { 
        var owners = [];
        if (file.belongToType == 'design') {
            Design.findById(file.belongTo)
            .populate('owner')
            .exec(function(err, design){
                if (err) {return res.send(500,err);}
                owners = _.union(design.owner.leader, design.invitees);
                _.each(design.owner.member, function(member){
                    if (member._id) {
                        owners.push(member._id);
                    }
                });
                _.remove(owners, req.user._id);
                async.each(owners, function(owner, callback){
                    var notification = new Notification({
                        owner: owner,
                        fromUser: req.user._id,
                        toUser: owner,
                        element: {file: file.toJSON(),
                            uploadIn: design,
                            projectId: design.project},
                        referenceTo: "DocumentDesign",
                        type: 'uploadDocument'
                    });
                    notification.save(callback);
                }, function(err) {
                    if (err) {return res.send(500,err);}
                    design.save(function(err){
                        if (err) {return res.send(500,err);}
                        return res.send(file.toJSON());
                    });
                });
            });
        }
        else if (file.belongToType == 'contractor') {
            ContractorPackage.findById(file.belongTo).populate('owner')
            .populate('winnerTeam._id').exec(function(err, contractorPackage) {
                if (err) {return res.send(500,err);}
                
                _.each(contractorPackage.to, function(toContractor){
                    if (toContractor._id && toContractor._id.toString() == req.user.team._id.toString()) {
                        toContractor.quoteDocument.push(file._id);
                        contractorPackage.markModified('toContractor.quoteDocument');
                    }
                });
                owners = contractorPackage.owner.leader;
                if (contractorPackage.winnerTeam._id) {
                    owners = _.union(contractorPackage.owner.leader, contractorPackage.winnerTeam._id.leader);
                    _.each(contractorPackage.winnerTeam._id.member, function(member){
                        if (member._id) {
                            owners.push(member._id);
                        }
                    });
                }
                _.each(contractorPackage.owner.member, function(member){
                    if (member._id) {
                        owners.push(member._id);
                    }
                });
                
                _.remove(owners, req.user._id);
                async.each(owners, function(leader, callback){
                    var notification = new Notification({
                        owner: leader,
                        fromUser: req.user._id,
                        toUser: leader,
                        element: {file: file.toJSON(),
                            uploadIn: contractorPackage,
                            projectId: contractorPackage.project},
                        referenceTo: "DocumentContractorPackage",
                        type: 'uploadDocument'
                    });
                    notification.save(callback);
                }, function(err){
                    if (err) {return res.send(500,err);}
                    contractorPackage.save(function(err){
                        if (err) {return res.send(500,err);}
                        return res.send(file.toJSON());
                    });
                });
            });
        }
        else if (file.belongToType == 'material') {
            MaterialPackage.findById(file.belongTo).populate('owner')
            .populate('winnerTeam._id').exec(function(err, materialPackage) {
                if (err) {return res.send(500,err);}
                _.each(materialPackage.to, function(toSupplier){
                    if (toSupplier._id && toSupplier._id.toString() == req.user.team._id.toString()) {
                        toSupplier.quoteDocument.push(file._id);
                        materialPackage.markModified('toSupplier.quoteDocument');
                    }
                });
                owners = materialPackage.owner.leader;
                if (materialPackage.winnerTeam._id) {
                    owners = _.union(materialPackage.owner.leader, materialPackage.winnerTeam._id.leader);
                    _.each(materialPackage.winnerTeam._id.member, function(member){
                        if (member._id) {
                            owners.push(member._id);
                        }
                    });
                }

                _.each(materialPackage.owner.member, function(member){
                    if (member._id) {
                        owners.push(member._id);
                    }
                });
                
                _.remove(owners, req.user._id);
                async.each(owners, function(leader, callback){
                    var notification = new Notification({
                        owner: leader,
                        fromUser: req.user._id,
                        toUser: leader,
                        element: {file:file.toJSON(),
                            uploadIn: materialPackage,
                            projectId: materialPackage.project},
                        referenceTo: "DocumentMaterialPackage",
                        type: 'uploadDocument'
                    });
                    notification.save(callback);
                },function(err){
                    if (err) {return res.send(500,err);}
                    materialPackage.save(function(err) {
                        if (err) {return res.send(file.toJSON());}
                    });
                });
            });
        }
        else if (file.belongToType == 'staffPackage') {
            StaffPackage.findById(file.belongTo).populate('owner').exec(function(err, staffPackage) {
                if (err) {return res.send(500,err);}
                owners = _.union(staffPackage.owner.leader, staffPackage.staffs);
                _.remove(owners, req.user._id);
                async.each(owners, function(leader,callback){
                    var notification = new Notification({
                        owner: leader,
                        fromUser: req.user._id,
                        toUser: leader,
                        element: {file:file.toJSON(),
                            uploadIn: staffPackage,
                            projectId: staffPackage.project},
                        referenceTo: "DocumentStaffPackage",
                        type: 'uploadDocument'
                    });
                    notification.save(callback);
                },function(err) {
                    if (err) {return res.send(500,err);}
                    return res.send(file.toJSON());
                });
            });
        }
        else if (file.belongToType == 'variation') {
            Variation.findById(file.belongTo).populate('owner').populate('to._id').exec(function(err, variation) {
                if (err) {return res.send(500,err);}

                owners = variation.to._id.leader;
                _.each(variation.to._id.member, function(member){
                    if (member._id) {
                        owners.push(member._id);
                    }
                });
                if (variation.owner != null && variation.owner._id) {
                    owners = _.union(owners, variation.owner.leader);
                    _.each(variation.owner.member, function(member){
                        if (member._id) {
                            owners.push(member._id);
                        }
                    });
                }
                
                _.remove(owners, req.user._id);

                variation.to.quoteDocument.push(file._id);
                variation.markModified('to.quoteDocument');

                async.each(owners, function(leader,callback){
                    var notification = new Notification({
                        owner: leader,
                        fromUser: req.user._id,
                        toUser: leader,
                        element: {file:file.toJSON(),
                            uploadIn: variation,
                            projectId: variation.project},
                        referenceTo: "DocumentVariation",
                        type: 'uploadDocument'
                    });
                    notification.save(callback);
                },function(err){
                    if (err) {return res.send(500,err);}
                    variation.save(function(err){
                        if (err) {return res.send(500,err);}
                        return res.send(file.toJSON());
                    });
                });
            });
        }
        else {
            BuilderPackage.findById(file.belongTo)
            .populate('owner')
            .populate('to.team')
            .populate('winner').exec(function(err, builderPackage){
                if (err) {return res.send(500,err);}
                if (builderPackage.invitees.length > 0) {
                    _.each(builderPackage.invitees, function(invitee){
                        if (invitee._id && invitee._id.toString() == req.user.team._id.toString()) {
                            invitee.quoteDocument.push(file._id);
                            builderPackage.markModified('invitee.quoteDocument');
                        }
                    });
                }

                owners = builderPackage.owner.leader;
                _.each(builderPackage.owner.member, function(member){
                    if (member._id) {
                        owners.push(member._id);
                    }
                });
                if (builderPackage.to.team) {
                    owners = _.union(owners, builderPackage.to.team.leader);
                    _.each(builderPackage.to.team.member, function(member){
                        if (member._id) {
                            owners.push(member._id);
                        }
                    });
                } else if (builderPackage.winner) {
                    owners = _.union(owners, builderPackage.winner.leader);
                    _.each(builderPackage.winner.member, function(member) {
                        if (member._id) {
                            owners.push(member._id);
                        }
                    });
                }
                _.remove(owners, req.user._id);
                async.each(owners, function(leader,callback){
                    var notification = new Notification({
                        owner: leader,
                        fromUser: req.user._id,
                        toUser: leader,
                        element: {file:file.toJSON(),
                            uploadIn: builderPackage,
                            projectId: builderPackage.project},
                        referenceTo: "DocumentBuilderPackage",
                        type: 'uploadDocument'
                    });
                    notification.save(function(err) {
                        if (err) {callback(err);}
                        callback();
                    });
                },function(err) {
                    if (err) {return res.send(500,err);}
                    builderPackage.save(function(err){
                        if (err) {return res.send(500,err);}
                        return res.send(file.toJSON());
                    });
                });
            });
        }
    });
};

    // var root = path.normalize(__dirname + '/../../..');
    // var form = new formidable.IncomingForm();
    // var files = [];
    // var uploadedFile = null;
    // var uploadDir = "./client/media/files";
    // var usersRelatedTo;
    // var uploadedField = null;
    // mkdirp(uploadDir, function(err) {
    //     if (err) {console.log(err);}
    // });
    // form.uploadDir = uploadDir;
    // form.keepExtensions = true;
    // form.maxFieldsSize = 10 * 1024 * 1024;
    // form.parse(req, function(err, fields, files) {
    //     if (err) {console.log(err);}
    //     uploadedField = fields;
    // });
    
    // form.on('file', function (field, file) {
    //     if (field === 'file') {
    //         uploadedFile = file;
    //         files.push([field, file]);
    //     }
    // })
    // .on('end', function() {
    //     console.log(uploadedFile, uploadedField);
    //     if (uploadedFile && uploadedField) {
    //         if (uploadedField._id != 'undefined') {
    //             var tags = uploadedField.tags.split(',');
    //             File.findById(uploadedField._id, function(err, file) {
    //                 if (err) {console.log(err);}
    //                 file.title = uploadedField.title;
    //                 file.name = uploadedFile.name;
    //                 file.path = uploadedFile.path;
    //                 file.server = 's3';
    //                 file.mimeType = uploadedFile.type;
    //                 file.description = uploadedField.desc;
    //                 file.size = uploadedFile.size;
    //                 file.version = file.version + 1;
    //                 file.belongTo = req.params.id;
    //                 file.tags = tags;
    //                 file.save(function(err, saved) {
    //                     if (err) {return res.send(500,err);}
    //                     else {
    //                         var owners = [];
    //                         async.parallel([
    //                             function(cb) {
    //                                 BuilderPackage.findOne({project: saved.belongTo})
    //                                 .populate('owner').populate("project").populate('to.team').exec(function(err,builderPackage){
    //                                     if (err || !builderPackage) {return cb(err);}
    //                                     else {
    //                                         owners = builderPackage.owner.leader;
    //                                         _.each(builderPackage.owner.member, function(member){
    //                                             if (member._id) {
    //                                                 owners.push(member._id);
    //                                             }
    //                                         });
    //                                         if (builderPackage.to.team) {
    //                                             owners = _.union(builderPackage.owner.leader, builderPackage.to.team.leader);
    //                                             _.each(builderPackage.to.team.member, function(member){
    //                                                 if (member._id) {
    //                                                     owners.push(member._id);
    //                                                 }
    //                                             });
    //                                         }
    //                                         _.remove(owners, req.user._id);
    //                                         async.each(owners, function(leader, callback){
    //                                             var notification = new Notification({
    //                                                 owner: leader,
    //                                                 fromUser: req.user._id,
    //                                                 toUser: leader,
    //                                                 element: {file: saved.toJSON(), 
    //                                                     uploadIn: builderPackage,
    //                                                     projectId: builderPackage.project},
    //                                                 referenceTo: "DocumentInProject",
    //                                                 type: 'uploadNewDocumentVersion'
    //                                             });
    //                                             notification.save(callback);
    //                                         }, cb);
    //                                     }
    //                                 });
    //                             },
    //                             function(cb) {
    //                                 s3.uploadFile(saved, function(err, data) {
    //                                     if (err || !data) {return cb(err);}
    //                                     else {
    //                                         if (saved.mimeType == 'image/png' || saved.mimeType == 'image/jpeg') {
    //                                             gm(config.root +'/' + saved.path)
    //                                             .resize(320, 480)
    //                                             .write(config.media +saved._id + '.jpg', function(err,data) {
    //                                                 if (err) {return cb(err);}
    //                                                 else {
    //                                                     cb(data);        
    //                                                 }
    //                                             });
    //                                         }
    //                                         else if (saved.mimeType == 'application/pdf') {
    //                                             exec("gs -dNOPAUSE -sDEVICE=jpeg -dFirstPage=1 -dLastPage=1 -r144 -sOutputFile="+ config.media +saved._id +".jpg "+ config.root + '/' + saved.path, function(err,stdout,stderr){
    //                                                 if (err) {return cb(err);}
    //                                                 else {
    //                                                     cb(stdout);
    //                                                 }
    //                                             });
    //                                             setTimeout(function() {
    //                                                 cb(data);
    //                                             }, 2000);
    //                                         }
    //                                         else {
    //                                             return cb(data); 
    //                                         }
    //                                     }
    //                                 });
    //                             }
    //                         ], function(){
    //                             return res.send(200,saved);
    //                         });
    //                     }
    //                 });
    //             });
    //         }
    //         else {
    //             var tags = uploadedField.tags.split(',');
    //             var file = new File({
    //                 title: uploadedField.title,
    //                 name: uploadedFile.name,
    //                 path: uploadedFile.path,
    //                 server: 's3',
    //                 mimeType: uploadedFile.type,
    //                 description: uploadedField.desc,
    //                 size: uploadedFile.size,
    //                 user: req.user._id,
    //                 belongTo: req.params.id,
    //                 tags: tags
    //             });
    //             file.save(function(err, saved){
    //                 file.save(function(err, fileSaved) {
    //                     if (err) {return res.send(500,err);}
    //                     else {
    //                         var owners = [];
    //                         async.parallel([
    //                             function(cb) {
    //                                 BuilderPackage.findOne({project: saved.belongTo})
    //                                 .populate('owner').populate("project").populate('to.team').exec(function(err,builderPackage){
    //                                     if (err || !builderPackage) {return cb(err);}
    //                                     else {
    //                                         owners = builderPackage.owner.leader;
    //                                         _.each(builderPackage.owner.member, function(member){
    //                                             if (member._id) {
    //                                                 owners.push(member._id);
    //                                             }
    //                                         });
    //                                         if (builderPackage.to.team) {
    //                                             owners = _.union(builderPackage.owner.leader, builderPackage.to.team.leader);
    //                                             _.each(builderPackage.to.team.member, function(member){
    //                                                 if (member._id) {
    //                                                     owners.push(member._id);
    //                                                 }
    //                                             });
    //                                         }
    //                                         _.remove(owners, req.user._id);
    //                                         async.each(owners, function(leader,callback){
    //                                             var notification = new Notification({
    //                                                 owner: leader,
    //                                                 fromUser: req.user._id,
    //                                                 toUser: leader,
    //                                                 element: {file: saved.toJSON(), 
    //                                                     uploadIn: builderPackage,
    //                                                     projectId: builderPackage.project},
    //                                                 referenceTo: "DocumentInProject",
    //                                                 type: 'uploadDocument'
    //                                             });
    //                                             notification.save(callback);
    //                                         }, cb);
    //                                     }
    //                                 });
    //                             },
    //                             function(cb) {
    //                                 s3.uploadFile(saved, function(err, data) {
    //                                     if (err) {return cb(err);}
    //                                     else {
    //                                         if (saved.mimeType == 'image/png' || saved.mimeType == 'image/jpeg') {
    //                                             gm(config.root + '/' + saved.path)
    //                                             .resize(320, 480)
    //                                             .write(config.media +saved._id + '.jpg', function(err,data) {
    //                                                 if (err) {return cb(err);}
    //                                                 else {
    //                                                     cb(data);        
    //                                                 }
    //                                             });
    //                                         }
    //                                         else if (saved.mimeType == 'application/pdf') {
    //                                             // exec("C:/Program Files (x86)/gs/gs9.16/bin/gswin32c.exe -dNOPAUSE -sDEVICE=jpeg -r144 -sOutputFile="+ config.media +saved._id + '-' +saved.title+".jpg "+ config.root + '/' + saved.path, function(err,data){
    //                                             exec("gs -dNOPAUSE -sDEVICE=jpeg -dFirstPage=1 -dLastPage=1 -r144 -sOutputFile="+ config.media +saved._id +".jpg "+ config.root + '/' + saved.path, function(err,stdout,stderr){
    //                                                 if (err) {return cb(err);}
    //                                                 else {
    //                                                     cb(stdout);
    //                                                 }
    //                                             });
    //                                             setTimeout(function() {
    //                                                 cb(data);
    //                                             }, 2000);
    //                                         }
    //                                         else {
    //                                             return cb(data);
    //                                         }
    //                                     }
    //                                 });
    //                             }
    //                         ],function(){
    //                             return res.send(200,saved);
    //                         })
    //                     }
    //                 });
    //             });
    //         }
    //     }
    // })
// };


// exports.uploadInPackge = function(req, res){
//     console.log('222222222222222222');
//     // var root = path.normalize(__dirname + '/../../..');
//     var form = new formidable.IncomingForm();
//     var files = [];
//     var uploadedFile = null;
//     var uploadDir = "./client/media/files";
//     var uploadedField = null;
//     mkdirp(uploadDir, function(err) {
//         if (err) {console.log(err);}
//     });
//     form.uploadDir = uploadDir;
//     form.keepExtensions = true;
//     form.maxFieldsSize = 10 * 1024 * 1024;
//     form.parse(req, function(err, fields, files) {
//         if (err) {console.log(err);}
//         uploadedField = fields;
//     });
    
//     form.on('file', function (field, file) {
//         if (field === 'file') {
//             uploadedFile = file;
//             files.push([field, file]);
//         }
//     })
//     .on('end', function() {
//         if (uploadedFile && uploadedField) {
//             console.log(uploadedField,uploadedFile);
//             var tags = uploadedField.tags.split(',');
//             var file = new File();
//             file.title = (uploadedField.title == 'undefined') ? uploadedFile.name : uploadedField.title;
//             file.name = uploadedFile.name;
//             file.server = 's3';
//             file.user = req.user._id;
//             file.path = uploadedFile.path;
//             file.mimeType = uploadedFile.type;
//             file.description = uploadedField.desc;
//             file.size = uploadedFile.size;
//             file.version = file.version;
//             file.belongTo = req.params.id;
//             file.belongToType = uploadedField.belongToType;
//             file.uploadBy = req.user.team._id;
//             file.tags = tags;
//             file.isQuote = uploadedField.isQuote;
//             file.save(function(err, saved) {
//                 if (err) {console.log(err);return res.send(500,err);}
//                 else {
//                     async.parallel([
//                         function(cb) {
//                             var owners = [];
//                             if (saved.belongToType == 'design') {
//                                 Design.findById(saved.belongTo)
//                                 .populate('owner')
//                                 .exec(function(err, design){
//                                     if (err || !design) {return cb(err);}
//                                     owners = _.union(design.owner.leader, design.invitees);
//                                     _.each(design.owner.member, function(member){
//                                         if (member._id) {
//                                             owners.push(member._id);
//                                         }
//                                     });
//                                     _.remove(owners, req.user._id);
//                                     async.each(owners, function(owner, callback){
//                                         var notification = new Notification({
//                                             owner: owner,
//                                             fromUser: req.user._id,
//                                             toUser: owner,
//                                             element: {file: saved.toJSON(),
//                                                 uploadIn: design,
//                                                 projectId: design.project},
//                                             referenceTo: "DocumentDesign",
//                                             type: 'uploadDocument'
//                                         })
//                                     }, cb);
//                                     design.save();
//                                 });
//                             }
//                             else if (saved.belongToType == 'contractor') {
//                                 ContractorPackage.findById(saved.belongTo).populate('owner')
//                                 .populate('winnerTeam._id').exec(function(err, contractorPackage) {
//                                     if (err || !contractorPackage) {return cb();}
                                    
//                                     _.each(contractorPackage.to, function(toContractor){
//                                         if (toContractor._id && toContractor._id.toString() == req.user.team._id.toString()) {
//                                             toContractor.quoteDocument.push(saved._id);
//                                             contractorPackage.markModified('toContractor.quoteDocument');
//                                         }
//                                     });
//                                     owners = contractorPackage.owner.leader;
//                                     if (contractorPackage.winnerTeam._id) {
//                                         owners = _.union(contractorPackage.owner.leader, contractorPackage.winnerTeam._id.leader);
//                                         _.each(contractorPackage.winnerTeam._id.member, function(member){
//                                             if (member._id) {
//                                                 owners.push(member._id);
//                                             }
//                                         });
//                                     }
//                                     _.each(contractorPackage.owner.member, function(member){
//                                         if (member._id) {
//                                             owners.push(member._id);
//                                         }
//                                     });
                                    
//                                     _.remove(owners, req.user._id);
//                                     async.each(owners, function(leader, callback){
//                                         var notification = new Notification({
//                                             owner: leader,
//                                             fromUser: req.user._id,
//                                             toUser: leader,
//                                             element: {file: saved.toJSON(),
//                                                 uploadIn: contractorPackage,
//                                                 projectId: contractorPackage.project},
//                                             referenceTo: "DocumentContractorPackage",
//                                             type: 'uploadDocument'
//                                         });
//                                         notification.save(callback);
//                                     },cb);
//                                     contractorPackage.save();
//                                 });
//                             }
//                             else if (saved.belongToType == 'material') {
//                                 MaterialPackage.findById(saved.belongTo).populate('owner')
//                                 .populate('winnerTeam._id').exec(function(err, materialPackage) {
//                                     if (err || !materialPackage) {return cb();}
//                                     _.each(materialPackage.to, function(toSupplier){
//                                         if (toSupplier._id && toSupplier._id.toString() == req.user.team._id.toString()) {
//                                             toSupplier.quoteDocument.push(saved._id);
//                                             materialPackage.markModified('toSupplier.quoteDocument');
//                                         }
//                                     });
//                                     owners = materialPackage.owner.leader;
//                                     if (materialPackage.winnerTeam._id) {
//                                         owners = _.union(materialPackage.owner.leader, materialPackage.winnerTeam._id.leader);
//                                         _.each(materialPackage.winnerTeam._id.member, function(member){
//                                             if (member._id) {
//                                                 owners.push(member._id);
//                                             }
//                                         });
//                                     }

//                                     _.each(materialPackage.owner.member, function(member){
//                                         if (member._id) {
//                                             owners.push(member._id);
//                                         }
//                                     });
                                    
//                                     _.remove(owners, req.user._id);
//                                     materialPackage.save();
//                                     async.each(owners, function(leader, callback){
//                                         var notification = new Notification({
//                                             owner: leader,
//                                             fromUser: req.user._id,
//                                             toUser: leader,
//                                             element: {file:saved.toJSON(),
//                                                 uploadIn: materialPackage,
//                                                 projectId: materialPackage.project},
//                                             referenceTo: "DocumentMaterialPackage",
//                                             type: 'uploadDocument'
//                                         });
//                                         notification.save(callback);
//                                     },cb);
//                                 });
//                             }
//                             else if (saved.belongToType == 'staffPackage') {
//                                 StaffPackage.findById(saved.belongTo).populate('owner').exec(function(err, staffPackage) {
//                                     if (err || !staffPackage) {return cb();}
//                                     owners = _.union(staffPackage.owner.leader, staffPackage.staffs);
//                                     _.remove(owners, req.user._id);
//                                     async.each(owners, function(leader,callback){
//                                         var notification = new Notification({
//                                             owner: leader,
//                                             fromUser: req.user._id,
//                                             toUser: leader,
//                                             element: {file:saved.toJSON(),
//                                                 uploadIn: staffPackage,
//                                                 projectId: staffPackage.project},
//                                             referenceTo: "DocumentStaffPackage",
//                                             type: 'uploadDocument'
//                                         });
//                                         notification.save(callback);
//                                     },cb);
//                                 });
//                             }
//                             else if (saved.belongToType == 'variation') {
//                                 Variation.findById(saved.belongTo).populate('owner').populate('to._id').exec(function(err, variation) {
//                                     if (err || !variation) {return cb();}

//                                     owners = variation.to._id.leader;
//                                     _.each(variation.to._id.member, function(member){
//                                         if (member._id) {
//                                             owners.push(member._id);
//                                         }
//                                     });
//                                     if (variation.owner != null && variation.owner._id) {
//                                         owners = _.union(owners, variation.owner.leader);
//                                         _.each(variation.owner.member, function(member){
//                                             if (member._id) {
//                                                 owners.push(member._id);
//                                             }
//                                         });
//                                     }
                                    
//                                     _.remove(owners, req.user._id);

//                                     variation.to.quoteDocument.push(saved._id);
//                                     variation.markModified('to.quoteDocument');
//                                     variation.save();

//                                     async.each(owners, function(leader,callback){
//                                         var notification = new Notification({
//                                             owner: leader,
//                                             fromUser: req.user._id,
//                                             toUser: leader,
//                                             element: {file:saved.toJSON(),
//                                                 uploadIn: variation,
//                                                 projectId: variation.project},
//                                             referenceTo: "DocumentVariation",
//                                             type: 'uploadDocument'
//                                         });
//                                         notification.save(callback);
//                                     },cb);
//                                 });
//                             }
//                             else {
//                                 BuilderPackage.findById(saved.belongTo)
//                                 .populate('owner').populate('to.team').exec(function(err, builderPackage){
//                                     if (err || !builderPackage) {return cb();}
//                                     if (builderPackage.invitees.length > 0) {
//                                         _.each(builderPackage.invitees, function(invitee){
//                                             if (invitee._id && invitee._id.toString() == req.user.team._id.toString()) {
//                                                 invitee.quoteDocument.push(saved._id);
//                                                 builderPackage.markModified('invitee.quoteDocument');
//                                             }
//                                         });
//                                     }

//                                     owners = builderPackage.owner.leader;
//                                     _.each(builderPackage.owner.member, function(member){
//                                         if (member._id) {
//                                             owners.push(member._id);
//                                         }
//                                     });
//                                     if (builderPackage.to.team) {
//                                         owners = _.union(builderPackage.owner.leader, builderPackage.to.team.leader);
//                                         _.each(builderPackage.to.team.member, function(member){
//                                             if (member._id) {
//                                                 owners.push(member._id);
//                                             }
//                                         });
//                                     }
//                                     _.remove(owners, req.user._id);
//                                     builderPackage.save();
//                                     async.each(owners, function(leader,callback){
//                                         var notification = new Notification({
//                                             owner: leader,
//                                             fromUser: req.user._id,
//                                             toUser: leader,
//                                             element: {file:saved.toJSON(),
//                                                 uploadIn: builderPackage,
//                                                 projectId: builderPackage.project},
//                                             referenceTo: "DocumentBuilderPackage",
//                                             type: 'uploadDocument'
//                                         });
//                                         notification.save(callback);
//                                     },cb);
//                                 });
//                             }
//                         },
//                         function(cb) {
//                             s3.uploadFile(saved, function(err, data) {
//                                 if (err) {return cb(err);}
//                                 else {
//                                     if (saved.mimeType == 'image/png' || saved.mimeType == 'image/jpeg') {
//                                         gm(config.root + '/' + saved.path)
//                                         .resize(320, 480)
//                                         .write(config.media +saved._id + '.jpg', function(err,data) {
//                                             if (err) {return cb(err);}
//                                             else {
//                                                 cb(data);    
//                                             }
//                                         });
//                                     }
//                                     else if (saved.mimeType == 'application/pdf') {
//                                         // console.log('\''+'gs -dNOPAUSE -sDEVICE=jpeg -dFirstPage=1 -dLastPage=1 -r144 -sOutputFile='+config.media +saved._id + "-" +saved.title+".jpg "+ config.root +"/" + saved.path+'\'');
//                                         // exec('\''+'C:/Program Files (x86)/gs/gs9.16/bin/gswin32c.exe -dNOPAUSE -sDEVICE=jpeg -r144 -sOutputFile= '+config.media +saved._id + "-" +saved.title+".jpg "+ config.root + "/" + saved.path+'\'', function(err,stdout,stderr){
//                                         exec('gs -dNOPAUSE -sDEVICE=jpeg -dFirstPage=1 -dLastPage=1 -r144 -sOutputFile='+config.media +saved._id +".jpg "+ config.root +"/" + saved.path, function(err,stdout,stderr){
//                                             if (err) {console.log('err ' + err);return cb(err);}
//                                             else {
//                                                 // console.log('stdout : ' +stdout);
//                                                 // console.log('stderr: '+stderr);
//                                                 cb(stdout);
//                                                 // console.log(stdout);
//                                                 // console.log(stderr);
//                                                 // cb(stdout);
//                                             }
//                                         });
//                                         setTimeout(function() {
//                                             cb(data);
//                                         }, 2000);
//                                     }
//                                     else {
//                                         return res.json(200,data);
//                                     }
//                                 }
//                             });
//                         }
//                     ], function(){
//                         console.log(err);
//                         return res.send(200,saved);
//                     });
//                 }
//             });
//         }
//     })
// };