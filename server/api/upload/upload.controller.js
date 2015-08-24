'use strict';

var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var ContractorPackage = require('./../../models/contractorPackage.model');
var MaterialPackage = require('./../../models/materialPackage.model');
var StaffPackage = require('./../../models/staffPackage.model');
var Variation = require('./../../models/variation.model');
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
    console.log('11111111111111111');
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
    form.maxFieldsSize = 10 * 1024 * 1024;
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
        console.log(uploadedFile, uploadedField);
        if (uploadedFile && uploadedField) {
            if (uploadedField._id != 'undefined') {
                var tags = uploadedField.tags.split(',');
                File.findById(uploadedField._id, function(err, file) {
                    if (err) {console.log(err);}
                    file.title = uploadedField.title;
                    file.name = uploadedFile.name;
                    file.path = uploadedFile.path;
                    file.server = 's3';
                    file.mimeType = uploadedFile.type;
                    file.description = uploadedField.desc;
                    file.size = uploadedFile.size;
                    file.version = file.version + 1;
                    file.belongTo = req.params.id;
                    file.tags = tags;
                    file.save(function(err, saved) {
                        if (err) {return res.send(500,err);}
                        else {
                            var owners = [];
                            async.parallel([
                                function(cb) {
                                    BuilderPackage.findOne({project: saved.belongTo})
                                    .populate('owner').populate("project").populate('to.team').exec(function(err,builderPackage){
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
                                            }, cb);
                                        }
                                    });
                                },
                                function(cb) {
                                    s3.uploadFile(saved, function(err, data) {
                                        if (err || !data) {return cb(err);}
                                        else {
                                            if (saved.mimeType == 'image/png' || saved.mimeType == 'image/jpeg') {
                                                gm(config.root +'/' + saved.path)
                                                .resize(320, 480)
                                                .write(config.media +saved._id + '-' +saved.title + '.jpg', function(err,data) {
                                                    if (err) {return cb(err);}
                                                    else {
                                                        cb(data);        
                                                    }
                                                });
                                            }
                                            else if (saved.mimeType == 'application/pdf') {
                                                exec("gs -dNOPAUSE -sDEVICE=jpeg -dFirstPage=1 -dLastPage=1 -r144 -sOutputFile="+ config.media +saved._id + '-' +saved.title+".jpg "+ config.root + '/' + saved.path, function(err,stdout,stderr){
                                                    if (err) {return cb(err);}
                                                    else {
                                                        cb(stdout);
                                                    }
                                                });
                                                setTimeout(function() {
                                                    cb(data);
                                                }, 2000);
                                            }
                                            else {
                                                return cb(data); 
                                            }
                                        }
                                    });
                                }
                            ], function(){
                                return res.send(200,saved);
                            });
                        }
                    });
                });
            }
            else {
                var tags = uploadedField.tags.split(',');
                var file = new File({
                    title: uploadedField.title,
                    name: uploadedFile.name,
                    path: uploadedFile.path,
                    server: 's3',
                    mimeType: uploadedFile.type,
                    description: uploadedField.desc,
                    size: uploadedFile.size,
                    user: req.user._id,
                    belongTo: req.params.id,
                    tags: tags
                });
                file.save(function(err, saved){
                    file.save(function(err, fileSaved) {
                        if (err) {return res.send(500,err);}
                        else {
                            var owners = [];
                            async.parallel([
                                function(cb) {
                                    BuilderPackage.findOne({project: saved.belongTo})
                                    .populate('owner').populate("project").populate('to.team').exec(function(err,builderPackage){
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
                                            }
                                            _.remove(owners, req.user._id);
                                            async.each(owners, function(leader,callback){
                                                var notification = new Notification({
                                                    owner: leader,
                                                    fromUser: req.user._id,
                                                    toUser: leader,
                                                    element: {file: saved.toJSON(), 
                                                        uploadIn: builderPackage,
                                                        projectId: builderPackage.project},
                                                    referenceTo: "DocumentInProject",
                                                    type: 'uploadDocument'
                                                });
                                                notification.save(callback);
                                            }, cb);
                                        }
                                    });
                                },
                                function(cb) {
                                    s3.uploadFile(saved, function(err, data) {
                                        if (err) {return cb(err);}
                                        else {
                                            if (saved.mimeType == 'image/png' || saved.mimeType == 'image/jpeg') {
                                                gm(config.root + '/' + saved.path)
                                                .resize(320, 480)
                                                .write(config.media +saved._id + '-' +saved.title + '.jpg', function(err,data) {
                                                    if (err) {return cb(err);}
                                                    else {
                                                        cb(data);        
                                                    }
                                                });
                                            }
                                            else if (saved.mimeType == 'application/pdf') {
                                                // exec("C:/Program Files (x86)/gs/gs9.16/bin/gswin32c.exe -dNOPAUSE -sDEVICE=jpeg -r144 -sOutputFile="+ config.media +saved._id + '-' +saved.title+".jpg "+ config.root + '/' + saved.path, function(err,data){
                                                exec("gs -dNOPAUSE -sDEVICE=jpeg -dFirstPage=1 -dLastPage=1 -r144 -sOutputFile="+ config.media +saved._id + '-' +saved.title+".jpg "+ config.root + '/' + saved.path, function(err,stdout,stderr){
                                                    if (err) {return cb(err);}
                                                    else {
                                                        cb(stdout);
                                                    }
                                                });
                                                setTimeout(function() {
                                                    cb(data);
                                                }, 2000);
                                            }
                                            else {
                                                return cb(data);
                                            }
                                        }
                                    });
                                }
                            ],function(){
                                return res.send(200,saved);
                            })
                        }
                    });
                });
            }
        }
    })
};


exports.uploadInPackge = function(req, res){
    console.log('222222222222222222');
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
    form.maxFieldsSize = 10 * 1024 * 1024;
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
            console.log(uploadedField,uploadedFile);
            var tags = uploadedField.tags.split(',');
            var file = new File();
            file.title = (uploadedField.title == 'undefined') ? uploadedFile.name : uploadedField.title;
            file.name = uploadedFile.name;
            file.server = 's3';
            file.user = req.user._id;
            file.path = uploadedFile.path;
            file.mimeType = uploadedFile.type;
            file.description = uploadedField.desc;
            file.size = uploadedFile.size;
            file.version = file.version;
            file.belongTo = req.params.id;
            file.belongToType = uploadedField.belongToType;
            file.uploadBy = req.user.team._id;
            file.tags = tags;
            file.isQuote = uploadedField.isQuote;
            file.save(function(err, saved) {
                if (err) {console.log(err);return res.send(500,err);}
                else {
                    async.parallel([
                        function(cb) {
                            var owners = [];
                            if (saved.belongToType == 'contractor') {
                                ContractorPackage.findById(saved.belongTo).populate('owner')
                                .populate('winnerTeam._id').exec(function(err, contractorPackage) {
                                    if (err || !contractorPackage) {return cb();}
                                    
                                    _.each(contractorPackage.to, function(toContractor){
                                        if (toContractor._id && toContractor._id.toString() == req.user.team._id.toString()) {
                                            toContractor.quoteDocument.push(saved._id);
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
                                            element: {file: saved.toJSON(),
                                                uploadIn: contractorPackage,
                                                projectId: contractorPackage.project},
                                            referenceTo: "DocumentContractorPackage",
                                            type: 'uploadDocument'
                                        });
                                        notification.save(callback);
                                    },cb);
                                    contractorPackage.save();
                                });
                            }
                            else if (saved.belongToType == 'material') {
                                MaterialPackage.findById(saved.belongTo).populate('owner')
                                .populate('winnerTeam._id').exec(function(err, materialPackage) {
                                    if (err || !materialPackage) {return cb();}
                                    _.each(materialPackage.to, function(toSupplier){
                                        if (toSupplier._id && toSupplier._id.toString() == req.user.team._id.toString()) {
                                            toSupplier.quoteDocument.push(saved._id);
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
                                    materialPackage.save();
                                    async.each(owners, function(leader, callback){
                                        var notification = new Notification({
                                            owner: leader,
                                            fromUser: req.user._id,
                                            toUser: leader,
                                            element: {file:saved.toJSON(),
                                                uploadIn: materialPackage,
                                                projectId: materialPackage.project},
                                            referenceTo: "DocumentMaterialPackage",
                                            type: 'uploadDocument'
                                        });
                                        notification.save(callback);
                                    },cb);
                                });
                            }
                            else if (saved.belongToType == 'staffPackage') {
                                StaffPackage.findById(saved.belongTo).populate('owner').exec(function(err, staffPackage) {
                                    if (err || !staffPackage) {return cb();}
                                    owners = _.union(staffPackage.owner.leader, staffPackage.staffs);
                                    _.remove(owners, req.user._id);
                                    async.each(owners, function(leader,callback){
                                        var notification = new Notification({
                                            owner: leader,
                                            fromUser: req.user._id,
                                            toUser: leader,
                                            element: {file:saved.toJSON(),
                                                uploadIn: staffPackage,
                                                projectId: staffPackage.project},
                                            referenceTo: "DocumentStaffPackage",
                                            type: 'uploadDocument'
                                        });
                                        notification.save(callback);
                                    },cb);
                                });
                            }
                            else if (saved.belongToType == 'variation') {
                                Variation.findById(saved.belongTo).populate('owner').populate('to._id').exec(function(err, variation) {
                                    if (err || !variation) {return cb();}

                                    owners = _.union(variation.owner.leader, variation.to._id.leader);
                                    _.each(variation.owner.member, function(member){
                                        if (member._id) {
                                            owners.push(member._id);
                                        }
                                    });
                                    _.each(variation.to._id.member, function(member){
                                        if (member._id) {
                                            owners.push(member._id);
                                        }
                                    });
                                    _.remove(owners, req.user._id);

                                    variation.to.quoteDocument.push(saved._id);
                                    variation.markModified('to.quoteDocument');
                                    variation.save();

                                    async.each(owners, function(leader,callback){
                                        var notification = new Notification({
                                            owner: leader,
                                            fromUser: req.user._id,
                                            toUser: leader,
                                            element: {file:saved.toJSON(),
                                                uploadIn: variation,
                                                projectId: variation.project},
                                            referenceTo: "DocumentVariation",
                                            type: 'uploadDocument'
                                        });
                                        notification.save(callback);
                                    },cb);
                                });
                            }
                            else {
                                BuilderPackage.findById(saved.belongTo)
                                .populate('owner').populate('to.team').exec(function(err, builderPackage){
                                    if (err || !builderPackage) {return cb();}
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
                                    }
                                    _.remove(owners, req.user._id);
                                    async.each(owners, function(leader,callback){
                                        var notification = new Notification({
                                            owner: leader,
                                            fromUser: req.user._id,
                                            toUser: leader,
                                            element: {file:saved.toJSON(),
                                                uploadIn: builderPackage,
                                                projectId: builderPackage.project},
                                            referenceTo: "DocumentBuilderPackage",
                                            type: 'uploadDocument'
                                        });
                                        notification.save(callback);
                                    },cb);
                                });
                            }
                        },
                        function(cb) {
                            s3.uploadFile(saved, function(err, data) {
                                if (err) {return cb(err);}
                                else {
                                    if (saved.mimeType == 'image/png' || saved.mimeType == 'image/jpeg') {
                                        gm(config.root + '/' + saved.path)
                                        .resize(320, 480)
                                        .write(config.media +saved._id + '-' +saved.title + '.jpg', function(err,data) {
                                            if (err) {return cb(err);}
                                            else {
                                                cb(data);    
                                            }
                                        });
                                    }
                                    else if (saved.mimeType == 'application/pdf') {
                                        console.log('\''+'gs -dNOPAUSE -sDEVICE=jpeg -dFirstPage=1 -dLastPage=1 -r144 -sOutputFile='+config.media +saved._id + "-" +saved.title+".jpg "+ config.root +"/" + saved.path+'\'');
                                        // exec('\''+'C:/Program Files (x86)/gs/gs9.16/bin/gswin32c.exe -dNOPAUSE -sDEVICE=jpeg -r144 -sOutputFile= '+config.media +saved._id + "-" +saved.title+".jpg "+ config.root + "/" + saved.path+'\'', function(err,stdout,stderr){
                                        exec('gs -dNOPAUSE -sDEVICE=jpeg -dFirstPage=1 -dLastPage=1 -r144 -sOutputFile='+config.media +saved._id + "-" +saved.title+".jpg "+ config.root +"/" + saved.path, function(err,stdout,stderr){
                                            if (err) {console.log('err ' + err);return cb(err);}
                                            else {
                                                console.log('stdout : ' +stdout);
                                                console.log('stderr: '+stderr);
                                                cb(stdout);
                                                // console.log(stdout);
                                                // console.log(stderr);
                                                // cb(stdout);
                                            }
                                        });
                                        setTimeout(function() {
                                            cb(data);
                                        }, 2000);
                                    }
                                    else {
                                        return res.json(200,data);
                                    }
                                }
                            });
                        }
                    ], function(){
                        console.log(err);
                        return res.send(200,saved);
                    });
                }
            });
        }
    })
};