'use strict';
var User = require('./../../models/user.model');
var File = require('./../../models/file.model');
var People = require('./../../models/people.model');
var Board = require('./../../models/board.model');
var Project = require('./../../models/project.model');
var Notification = require('./../../models/notification.model');
var RelatedItem = require('../../components/helpers/related-item');
var _ = require('lodash');
var async = require('async');
var s3 = require('../../components/S3');
var mongoose = require('mongoose');

function populateFile(file, res){
    File.populate(file, [
        {path: "owner", select: "_id email name"},
        {path: "members", select: "_id email name"},
        {path: "activities.user", select: "_id email name"},
        {path: "acknowledgeUser._id", select: "_id email name"}
    ], function(err, file) {
        return res.send(200, file);
    });
};

exports.getFilesByProject = function(req, res) {
    var query;
    if (req.params.type === "file") {
        query = {project: req.params.id, 'element.type': 'file', $or: [{owner: req.user._id}, {members: req.user._id}]};
    } else if (req.params.type === "document") {
        query = {project: req.params.id, "element.type": "document"};
    }
    File.find(query).populate("members", "_id name email").exec(function(err, files) {
        if (err) {return res.send(500,err);}
        return res.send(200,files);
    });
};  

exports.show = function(req, res) {
    File.findById(req.params.id)
    .populate("owner", "_id name email")
    .populate("members", "_id name email")
    .populate("activities.user", "_id name email")
    .populate("acknowledgeUser._id", "_id name email")
    .exec(function(err, file) {
        if (err) 
            return res.send(500, err);
        RelatedItem.responseWithRelated("file", file, req.user, res);
    });
};

exports.update = function(req, res) {
    var data = req.body;
    File.findById(req.params.id, function(err, file) {
        if (err) {return res.send(500,err);}
        else if (!file) {return res.send(404, "The specific file is not existed");}
        else {
            var activity = {
                user: req.user._id,
                type: req.body.editType,
                createdAt: new Date(),
                element: {}
            };
            async.parallel([
                function(cb) {
                    if (data.editType === "edit") {
                        var tags = [];
                        _.each(data.tags, function(tag) {
                            tags.push(tag.name);
                        });
                        activity.element.name = (file.name.length !== data.name.length) ? file.name : null;
                        activity.element.description = (file.description && file.description.length !== data.description.length) ? file.description : null;
                        activity.element.tags = (file.tags.length !== data.tags.length) ? file.tags : null;
                        file.name = data.name;
                        file.description = data.description;
                        file.tags = tags;
                        cb();
                    } else if (data.editType === "assign") {
                        var members = [];
                        async.each(data.newMembers, function(member, cb) {
                            members.push(member.email);
                            User.findOne({email: member.email}, function(err, user) {
                                if (err) {cb();}
                                else if (!user) {
                                    file.notMembers.push(member.email);
                                    cb();
                                } else {
                                    file.members.push(user._id);
                                    cb();
                                }
                            });
                        }, function() {
                            activity.element.members = members;
                            cb();
                        });
                    }
                }
            ], function(err, result) {
                if (err) {return res.send(500,err);}
                file.activities.push(activity);
                file.save(function(err) {
                    if (err) {return res.send(500,err);}
                    File.populate(file, [
                    {path:"owner", select:"_id name email"},
                    {path:"members", select:"_id name email"},
                    {path:"activities.user", select:"_id name email"},
                    ], function(err, file) {
                        RelatedItem.responseWithRelated("file", file, req.user, res);
                    });
                });
            });
        }
    });
};

exports.acknowledgement = function(req, res) {
    File.findById(req.params.id, function(err, file) {
        if (err) {return res.send(500,err);}
        else if (!file) {return res.send(404);}
        if (_.findIndex(file.members, function(id) {
            return id.toString()===req.user._id.toString();
        }) !== -1) {
            file.acknowledgeUser.push({_id: req.user._id});
            file.save(function(err) {
                if (err) {return res.send(500,err);}
                populateFile(file, res);
            });
        } else {
            return res.send(500, {message: "You haven\'t got privilege"});
        }
    });
};

exports.acknowledgementViaEmail = function(req, res) {
    File.findById(req.params.id, function(err, file) {
        if (err) {return res.send(500,err);}
        else if (!file) {return res.send(404);}
        if (_.indexOf(file.notMembers, req.params.type) !== -1) {
            console.log(file.notMembers);
            file.acknowledgeUser.push({email: req.params.type});
            file.save(function(err) {
                if (err) {return res.send(500,err);}
                return res.redirect(file.path);
            });
        } else {
            return res.send(500, {message: "You haven\'t got privilege"});
        }
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
                    if (err) {return res.send(500,err);}
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

exports.getAllByUser = function(req, res) {
    Notification.find({owner: req.user._id, unread: true, $or:[{type: 'uploadNewDocumentVersion'},{type: 'uploadDocument'}]}, function(err, documents){
        if (err) {return res.send(500,err);}
        return res.send(200,documents);
    });
};

exports.getInPeople = function(req, res) {
    File.find({belongTo: req.params.id, belongToType: 'people'}, function(err, files){
        if (err) {return res.send(500,err);}
        return res.send(200,files);
    });
};

exports.getInBoard = function(req, res) {
    File.find({belongTo: req.params.id, belongToType: 'board'}, function(err, files){
        if (err) {return res.send(500,err);}
        return res.send(200,files);
    });
};

exports.getInProject = function(req, res) {
    File.find({belongTo: req.params.id, belongToType: 'project'}, function(err, files){
        if (err) {return res.send(500,err);}
        return res.send(200,files);
    });
};

exports.myFiles = function(req, res) {
    Notification.find({owner: req.user._id, unread: true, $or:[{type: 'uploadDocument'}, {type: 'uploadNewDocumentVersion'}]}, function(err, files) {
        if (err) {return res.send(500,err);}
        var results = [];
        async.each(files, function(file, cb) {
            if (file.referenceTo === "documentInpeople" || file.referenceTo === "documentInboard") {
                Project.findById(file.element.package.project, function(err, project) {
                    if (err || !project) {console.log('error');cb();}
                    else {
                        file.project = project;
                        results.push(file);
                        cb();
                    }
                });
            } else if (file.referenceTo === "uploadDocument" || file.referenceTo === "uploadNewDocumentVersion") {
                Project.findById(file.element.projectId, function(err, project) {
                    if (err || !project) {console.log('err'); cb();}
                    else {
                        file.project = project;
                        results.push(file);
                        cb();
                    }
                });
            }
        }, function() {
            return res.send(200, results);
        });
    });
};