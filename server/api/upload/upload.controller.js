'use strict';

var User = require('./../../models/user.model');
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
            file.title = request.file.filename;
            file.name = request.file.filename;
            file.path = request.file.url;
            file.server = 's3';
            file.mimeType = request.file.mimetype;
            file.description = request.desc;
            file.size = request.file.size;
            file.version = file.version + 1;
            file.belongTo = req.params.id;
            file.belongToType = 'project';
            file.tags = request.tags;
            file.save(function(err, saved) {
                if (err) {console.log(err);return res.send(500,err);}
                var owners = [];
                BuilderPackageNew.findOne({project: saved.belongTo})
                .populate('owner')
                .populate("project")
                .populate('to.team')
                .populate('member').exec(function(err,builderPackage){
                    if (err) {return res.send(500,err);}
                    owners.push(builderPackage.owner._id);
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
                    if (builderPackage.projectManager._id) {
                        owners.push(builderPackage.projectManager._id);
                    }
                    _.remove(owners, req.user._id);
                    var params = {
                        owners: owners,
                        fromUser: req.user._id,
                        element: {
                            file: saved.toJSON(), 
                            uploadIn: builderPackage,
                            projectId: builderPackage.project},
                        referenceTo: "DocumentInProject",
                        type: 'uploadNewDocumentVersion'
                    };
                    NotificationHelper.create(params, function() {
                        return res.send(file.toJSON());
                    });
                });
            });
        });
    } else {
        var file = new File({
            title: request.file.filename,
            name: request.file.filename,
            path: request.file.url,
            key: request.file.key,
            server: 's3',
            mimeType: request.file.mimeType,
            description: request.desc,
            size: request.file.size,
            user: req.user._id,
            belongTo: req.params.id,
            belongToType : 'project',
            tags: request.tags
        });
        file.save(function(err){
            if (err) {console.log(err);return res.send(500,err);}
            var owners = [];
            BuilderPackageNew.findOne({project: file.belongTo})
            .populate('owner')
            .populate("project")
            .populate('to.team')
            .populate('winner').exec(function(err,builderPackage){
                if (err) {return res.send(500,err);}
                if (!builderPackage) {return res.send(404);}
                else {
                    owners.push(builderPackage.owner._id);
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
                    if (builderPackage.projectManager._id) {
                        owners.push(builderPackage.projectManager._id);
                    }
                    _.remove(owners, req.user._id);
                    var params = {
                        owners: owners,
                        fromUser: req.user._id,
                        element: {
                            file: file.toJSON(),
                            uploadIn: builderPackage,
                            projectId: builderPackage.project
                        },
                        referenceTo: "DocumentInProject",
                        type: 'uploadNewDocumentVersion'
                    };
                    NotificationHelper.create(params, function(){
                        return res.send(file.toJSON());
                    });
                }
            });
        });
    }
};

exports.uploadInPeople = function(req, res) {
    var request = req.body.file;
    var file = new File({
        title: request.file.filename,
        name: request.file.filename,
        path: request.file.url,
        key: request.file.key,
        server: 's3',
        mimeType: request.file.mimeType,
        description: request.desc,
        size: request.file.size,
        user: req.user._id,
        belongTo: req.params.id,
        belongToType: request.belongToType,
        tags: request.tags
    });
    _.each(request.assignees, function(assignee) {
        file.usersRelatedTo.push(assignee);
    });
    file.save(function(err) {
        if (err) {return res.send(500,err);}
        return res.json(200,file);
    });
};

exports.uploadInBoard = function(req, res) {
    var request = req.body.file;
    var file = new File({
        title: request.file.filename,
        name: request.file.filename,
        path: request.file.url,
        key: request.file.key,
        server: 's3',
        mimeType: request.file.mimeType,
        description: request.desc,
        size: request.file.size,
        user: req.user._id,
        belongTo: req.params.id,
        belongToType: request.belongToType,
        tags: request.tags
    });
    file.save(function(err) {
        if (err) {return res.send(500,err);}
        return res.json(200,file);
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