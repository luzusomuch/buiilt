'use strict';

var User = require('./../../models/user.model');
var People = require('./../../models/people.model');
var Team = require('./../../models/team.model');
var Project = require('./../../models/project.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var BuilderPackageNew = require('./../../models/builderPackageNew.model');
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
var RelatedItem = require('../../components/helpers/related-item');
var EventBus = require('../../components/EventBus');

var getMainItem = function(type) {
    var _item = {};
    switch (type) {
        case 'thread' :
            _item = Thread;
            break;
        case 'task' :
            _item = Task;
            break;
        case 'file':
            _item = File;
            break;
        default :
            break;
    }
    return _item;
};

function populateThread(thread, res){
    Thread.populate(thread, [
        {path: "owner", select: "_id email name"},
        {path: "messages.user", select: "_id email name"},
        {path: "messages.mentions", select: "_id email name"},
        {path: "members", select: "_id email name"},
        {path: "activities.user", select: "_id email name"}
    ], function(err, thread) {
        return res.send(200, thread);
    });
};

function populateTask(task, res){
    Task.populate(task, [
        {path: "owner", select: "_id email name"},
        {path: "members", select: "_id email name"},
        {path: "activities.user", select: "_id email name"}
    ], function(err, task) {
        return res.send(200, task);
    });
};

function populateFile(file, res){
    File.populate(file, [
        {path: "owner", select: "_id email name"},
        {path: "members", select: "_id email name"},
        {path: "activities.user", select: "_id email name"}
    ], function(err, file) {
        return res.send(200, [file]);
    });
};

var validationError = function (res, err) {
    return res.json(422, err);
};

exports.uploadMobile = function(req, res) {
    var filesAfterInsert = [];
    var item = req.body;
    var file = new File({
        name: item.filename,
        path: item.url,
        key: item.key,
        server: 's3',
        mimeType: item.mimeType,
        description: item.desc,
        size: item.size,
        user: req.user._id,
        belongTo: req.params.id,
        belongToType: item.belongToType,
        peopleChat: item.peopleChat,
        tags: item.tags
    });
    file.save(function(err) {
        if (err) {return res.send(500,err);}
        else {
            return res.send(200,file);
        }
    });
};

exports.uploadReversion = function(req, res) {
    var newFile = req.body.files[0];
    File.findById(req.params.id, function(err, file) {
        if (err) {return res.send(500,err);}
        else if (!file) {return res.send(404, "The specific file is not existed");}
        else {
            var acknowledgeUsers = [];
            async.parallel([
                function(cb) {
                    if (file.element.type === "file") {
                        _.each(file.members, function(member) {
                            acknowledgeUsers.push({_id: member, isAcknow: false});
                        });
                        _.each(file.notMembers, function(member) {
                            acknowledgeUsers.push({email: member, isAcknow: false});
                        });
                        cb();
                    } else {
                        People.findOne({project: file.project}, function(err, people) {
                            if (err || !people) {cb();}
                            else {
                                var roles = ["builders", "clients", "architects", "subcontractors", "consultants"];
                                _.each(roles, function(role) {
                                    _.each(people[role], function(tender){
                                        if (tender.hasSelect && tender.tenderers[0]._id) {
                                            acknowledgeUsers.push({_id: tender.tenderers[0]._id});
                                        } else if (tender.hasSelect && tender.tenderers[0].email) {
                                            acknowledgeUsers.push({email: tender.tenderers[0].email});
                                        }
                                    });
                                });
                                _.remove(acknowledgeUsers, {_id: req.user._id});
                                cb();
                            }
                        });
                    }
                }
            ], function(err) {
                if (err) {return res.send(500,err);}
                var history = {
                    name: file.name,
                    description: file.description,
                    link: file.path,
                    version: file.version,
                    createdAt: new Date()
                };  
                file.name = newFile.filename,
                file.path = newFile.url,
                file.key = newFile.key,
                file.server = 's3',
                file.mimeType = newFile.mimeType,
                file.description = req.body.description,
                file.size = data.file.size,
                file.version = file.version + 1;
                file.fileHistory.push(history);
                var activity = {
                    type: "upload-reversion",
                    user: req.user._id,
                    createdAt: new Date(),
                    acknowledgeUsers: acknowledgeUsers,
                    element: {
                        name: file.name,
                        description: file.description
                    }
                };
                
                file.activities.push(activity);
                file._editType = "uploadReversion";
                file.save(function(err) {
                    if (err) {return res.send(500,err);}
                    File.populate(file, [
                        {path: "owner", select: "_id email name"},
                        {path: "members", select: "_id email name"},
                        {path: "activities.user", select: "_id email name"},
                        {path: "activities.acknowledgeUsers._id", select: "_id email name"}
                    ], function(err, file) {
                        if (file.element.type === "file") {
                            EventBus.emit('socket:emit', {
                                event: 'file:update',
                                room: file._id.toString(),
                                data: JSON.parse(JSON.stringify(file))
                            });
                        } else {
                            EventBus.emit('socket:emit', {
                                event: 'document:update',
                                room: file._id.toString(),
                                data: JSON.parse(JSON.stringify(file))
                            });
                        }
                        return res.send(200, file);
                    });
                });
            });
        }
    });
};

/**
 * upload
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */
exports.upload = function(req, res){
    var data = req.body;
    console.log(data);
    var filesAfterInsert = [];
    var members = [];
    var notMembers = [];
    var acknowledgeUsers = [];
    async.parallel([
        function(callback) {
            console.log(data.members, data.members.length);
            if (data.members && data.members.length > 0) {
                async.each(data.members, function(member, cb) {
                    User.findOne({email: member.email}, function(err, user) {
                        if (err) {console.log(err);cb(err);}
                        else if (!user) {
                            acknowledgeUsers.push({email: member.email, isAcknow: false});
                            notMembers.push(member.email);
                            cb();
                        }
                        else {
                            acknowledgeUsers.push({_id: user._id, isAcknow: false});
                            members.push(user._id);
                            cb();
                        }
                    });
                }, callback);
            } else {
                var roles = ["builders", "clients", "architects", "subcontractors", "consultants"];
                People.findOne({project: req.params.id}, function(err, people) {
                    if (err || !people) {callback();}
                    else {
                        _.each(roles, function(role) {
                            _.each(people[role], function(tender){
                                if (tender.hasSelect && tender.tenderers[0]._id) {
                                    acknowledgeUsers.push({_id: tender.tenderers[0]._id});
                                } else if (tender.hasSelect && tender.tenderers[0].email) {
                                    acknowledgeUsers.push({email: tender.tenderers[0].email});
                                }
                            });
                        });
                        _.remove(acknowledgeUsers, {_id: req.user._id});
                        callback();
                    }
                });
            }
        }
    ], function(err, result) {
        if (err) {return res.send(500,err);}
        var mainItem = getMainItem(data.belongToType);
        async.each(data.files, function(item, cb) {
            var file = new File({
                project: req.params.id,
                name: item.filename,
                path: item.url,
                key: item.key,
                server: 's3',
                mimeType: item.mimeType,
                description: data.description,
                size: item.size,
                owner: req.user._id,
                members: members,
                notMembers: notMembers,
                element: {type: item.type}
            });
            var tags = [];
            _.each(data.tags, function(tag) {
                tags.push(tag.name);
            });
            file.tags = tags;
            file.activities.push({
                type: "upload-file",
                user: req.user._id,
                createdAt: new Date(),
                acknowledgeUsers: acknowledgeUsers,
                element: {
                    name: file.name,
                    description: file.description
                }
            });
            if (data.belongTo) {
                file.belongTo.item = {_id: data.belongTo};
                file.belongTo.type = data.belongToType;
            }
            file.save(function(err) {
                if (err) {return cb(err);}
                else {
                    filesAfterInsert.push(file);
                    cb();
                }
            });
        }, function() {
            if (data.belongTo) {
                var file = filesAfterInsert[0];
                mainItem.findById(req.body.belongTo, function(err, main) {
                    main.activities.push({
                        user: req.user._id,
                        type: "related-file",
                        createdAt: new Date(),
                        element: {
                            item: file._id,
                            name: file.name,
                            related: true
                        }
                    });
                    members.push(req.user._id);
                    main.relatedItem.push({
                        type: "file",
                        item: {_id: file._id},
                        members: members
                    });
                    main._editUser = req.user;
                    main.save(function(err) {
                        if (err) {return res.send(500,err);}
                        populateFile(file, res);
                    });
                });
            } else {
                async.each(filesAfterInsert, function(file, cb) {
                    _.each(acknowledgeUsers, function(user) {
                        if (file.element.type === "file" && user._id) {
                            EventBus.emit('socket:emit', {
                                event: 'file:new',
                                room: user._id.toString(),
                                data: JSON.parse(JSON.stringify(file))
                            });
                        } else if (file.element.type === "document" && user._id) {
                            EventBus.emit('socket:emit', {
                                event: 'document:new',
                                room: user._id.toString(),
                                data: JSON.parse(JSON.stringify(file))
                            });
                        }
                    });
                    cb();
                }, function() {
                    return res.send(200, filesAfterInsert);
                });
                
            }
        });
    });
};

exports.uploadInPeople = function(req, res) {
    var files = req.body.files;
    var filesAfterInsert = [];
    async.each(files, function(item, cb) {
        var file = new File({
            title: item.filename,
            name: item.filename,
            path: item.url,
            key: item.key,
            server: 's3',
            mimeType: item.mimeType,
            description: item.desc,
            size: item.size,
            user: req.user._id,
            belongTo: req.params.id,
            belongToType: item.belongToType,
            tags: item.tags,
            peopleChat: item.peopleChat
        });
        _.each(item.assignees, function(assignee) {
            file.usersRelatedTo.push(assignee);
        });
        file.save(function(err) {
            if (err) {return cb(err);}
            else {
                filesAfterInsert.push(file);
                cb();
            }
        });
    }, function() {
        return res.send(200, filesAfterInsert);
    });
};

exports.uploadInBoard = function(req, res) {
    var files = req.body.file;
    var filesAfterInsert = [];
    async.each(files, function(item, cb) {
        var file = new File({
            title: item.filename,
            name: item.filename,
            path: item.url,
            key: item.key,
            server: 's3',
            mimeType: item.mimeType,
            description: item.desc,
            size: item.size,
            user: req.user._id,
            belongTo: req.params.id,
            belongToType: item.belongToType,
            tags: item.tags
        });
        file.save(function(err) {
            if (err) {return cb(err);}
            else {
                filesAfterInsert.push(file);
                cb();
            }
        });
    }, function() {
        return res.send(200,filesAfterInsert);
    });
    
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
            .populate('architect.team')
            .populate('winner')
            .exec(function(err, builderPackage){
                if (err) {return res.send(500,err);}
                if (builderPackage.invitees.length > 0) {
                    _.each(builderPackage.invitees, function(invitee){
                        if (invitee._id && invitee._id.toString() == req.user.team._id.toString()) {
                            invitee.quoteDocument.push(file._id);
                            builderPackage.markModified('invitee.quoteDocument');
                        }
                    });
                }
                if (builderPackage.hasArchitectManager) {
                    async.parallel({
                        team: function(cb) {
                            Team.findById(req.user.team._id, function(err, result){
                                if (err || !result) {return cb();}
                                cb(null, result);
                            });
                        },
                        owners: function(cb) {
                            var ownersTemp = [];
                            _.each(builderPackage.owner.leader, function(leader){
                                ownersTemp.push({_id:leader, teamType: builderPackage.owner.type});
                            });
                            _.each(builderPackage.owner.member, function(member){
                                if (member._id) {
                                    ownersTemp.push({_id:member._id, teamType: builderPackage.owner.type});
                                }
                            });
                            if (builderPackage.architect.team) {
                                _.each(builderPackage.architect.team.leader, function(leader){
                                    ownersTemp.push({_id:leader, teamType: builderPackage.architect.team.type});
                                });
                                _.each(builderPackage.architect.team.member, function(member){
                                    if (member._id) {
                                        ownersTemp.push({_id:member._id, teamType: builderPackage.architect.team.type});
                                    }
                                });
                            }
                            if (builderPackage.to) {
                                if (builderPackage.to.team) {
                                    _.each(builderPackage.to.team.leader, function(leader){
                                        ownersTemp.push({_id:leader, teamType: builderPackage.to.team.type});
                                    });
                                    _.each(builderPackage.to.team.member, function(member) {
                                        if (member._id) {
                                            ownersTemp.push({_id:member._id, teamType: builderPackage.to.team.type});
                                        }
                                    });
                                }
                            }
                            if (builderPackage.winner) {
                                _.each(builderPackage.winner.leader, function(leader){
                                    ownersTemp.push({_id:leader, teamType: builderPackage.winner.type});
                                });
                                _.each(builderPackage.winner.member, function(member) {
                                    if (member._id) {
                                        ownersTemp.push({_id:member._id, teamType: builderPackage.winner.type});
                                    }
                                });
                            }
                            cb(null, ownersTemp);
                        }
                    }, function(err, result){
                        if (err) {return res.send(500,err);}
                        var team = result.team;
                        if (team.type == 'builder') {
                            _.remove(result.owners, {teamType: 'homeOwner'});
                        } else if (team.type == 'homeOwner') {
                            _.remove(result.owners, {teamType: 'builder'});
                        }
                        result.owners = _.map(_.groupBy(result.owners,function(item){
                            return item._id;
                        }),function(grouped){
                            return grouped[0];
                        });
                        _.each(result.owners, function(item){
                            owners.push(item._id);
                        });
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
                } else {
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
                }
            });
        }
    });
};