'use strict';

var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var LimitProject = require('./../../models/limitProject.model');
var ProjectValidator = require('./../../validators/project');
var People = require('./../../models/people.model');
var Task = require('./../../models/task.model');
var Thread = require('./../../models/thread.model');
var File = require('./../../models/file.model');
var _ = require('lodash');
var async = require('async');
var json2csv = require('json2csv');
var Mailer = require('./../../components/Mailer');
var S3 = require('./../../components/S3');
var fs = require('fs');
var moment = require("moment");
var config = require('./../../config/environment');

exports.create = function(req, res){
    var user = req.user;
    Project.find({}, function(err, projects) {
        if (err) {return res.send(err);}
        var userTotalCreatedProjects = 0;
        _.each(projects, function(item) {
            if (item.owner.toString()===req.user._id.toString() && item.status === "waiting") {
                userTotalCreatedProjects += 1;
            }
        });
        var today = new Date();
        var allowCreate = false;
        // filter out user is not purchase for plan and in 14 days trial with this code
        // (moment(moment(user.createdAt).add(14, "days").format("YYYY-MM-DD")).isAfter(moment(today).format("YYYY-MM-DD")))

        // New filter, filter that user have reached maximun free project
        LimitProject.find({}, function(err, limitProjects) {
            var maximunFreeProjects;
            if (err) {return res.send(500,err);}
            if (limitProjects.length === 0) {
                maximunFreeProjects = 1;
            } 
            maximunFreeProjects = limitProjects[0].number;
            if (!user.plan && userTotalCreatedProjects<maximunFreeProjects) {
                allowCreate = true;
            } else {
                switch (user.plan) {
                    case "small":
                        if (userTotalCreatedProjects < 5)
                            allowCreate = true;
                    break;
                    case "medium":
                        if (userTotalCreatedProjects < 10)
                            allowCreate = true;
                    break;
                    case "large":
                        if (userTotalCreatedProjects < 15)
                            allowCreate = true;
                    break;
                    default:
                    break;
                }
            }
            if (allowCreate) {
                ProjectValidator.validateCreate(req,function(err,data) {
                    if (err) {
                        res.send(422,err);
                    }
                    var project = new Project(data);
                    project.status = 'waiting';
                    project.element = {};
                    project.projectManager._id = req.user._id,
                    project.projectManager.type = req.body.teamType,
                    project.save(function(err) {
                        if (err) {
                            res.send(422,err);
                        } else {
                            var people = new People({
                                project: project._id
                            });
                            if (req.body.teamType === "builder") {
                                people.builders.push({
                                    tenderName: "Builder",
                                    tenderers: [{
                                        _id: req.user._id,
                                        teamMember: []
                                    }],
                                    hasSelect: true, 
                                    inviter: req.user._id,
                                    createAt: new Date()
                                });
                            } else if (req.body.teamType === "homeOwner") {
                                people.clients.push({
                                    tenderName: "Client",
                                    tenderers: [{
                                        _id: req.user._id,
                                        teamMember: []
                                    }],
                                    hasSelect: true, 
                                    inviter: req.user._id,
                                    createAt: new Date()
                                });
                            } else if (req.body.teamType === "architect") {
                                people.architects.push({
                                    tenderName: "Architect",
                                    tenderers: [{
                                        _id: req.user._id,
                                        teamMember: []
                                    }],
                                    hasSelect: true, 
                                    inviter: req.user._id,
                                    createAt: new Date()
                                });
                            }
                            people.save();
                            User.findById(req.user._id, function(err, user) {
                                user.projects.push(project._id);
                                user.save(function(err) {
                                    return res.send(200, project);
                                });
                            });
                        }
                    });
                });
            } else {
                if (!user.plan && userTotalCreatedProjects > 0) {
                    return res.send(500, {message: "You Have Reached the Limit of Free Projects. Please Upgrade Your Subscription to Continue..."});
                } else {
                    return res.send(500, {message: "You Have Reached the Limit of Projects In Your Subscription. Please Upgrade to Continue..."});
                }
            }
        })
    });
};


exports.index = function(req, res) {
    Project.find({'user._id': req.user._id}, function(err, projects) {
        if (err)
        return res.send(500, err);
        res.json(200, projects);
    });
};


/**
 * show project detail
 */
exports.show = function(req, res){
    Project.findById(req.params.id)
    .exec(function(err, project){
        if(err){ return res.send(500, err); }
        else {
            req.project = project;
            // sendInfoToUser(req, res);
            return res.send(200, project);
        }
    });
};

exports.getAll = function(req, res) {
    var query = (req.query.userId) ? {owner: req.query.userId} : {};
    Project.find(query, function(err, projects){
        if (err) {return res.send(500,err);}
        return res.send(200,projects)
    });
};

exports.destroy = function (req, res) {
    Project.findByIdAndRemove(req.params.id, function (err, project) {
        if (err) {
            return res.send(500, err);
        }
        Project.find({}, function(err,projects){
            if (err) {return res.send(500,err);}
            return res.send(200, projects);
        })
    });
};

exports.updateProject = function(req, res) {
    var data = req.body;
    Project.findById(req.params.id, function(err, project) {
        if (err) {return res.send(500,err);}
        else if (!project) {return res.send(404, "The specific project is not existed");}
        if (project.owner.toString()===req.user._id.toString() || req.user.role==="admin") {
            project.name = data.name;
            project.description = data.description;
            project.address = data.address;
            project.suburb = data.suburb;
            project.postcode = data.postcode;
            if (data.archive) {
                project.status = "archive";
            }
            project.save(function(err) {
                if (err) {return res.send(500,err);}
                if (project.status == "archive") {
                    req.project = project;
                    // return res.send(200,project);
                    sendInfoToUser(req, res);
                } else {
                    return res.send(200,project);
                }
            });
        } else {
            return res.send(403, {mgs:"You have not authorized"});
        }
    });
};

function sendInfoToUser(req, res) {
    async.parallel({
        people: function(cb) {
            People.findOne({project: req.project._id})
            .populate("builders.tenderers._id", "_id email name")
            .populate("builders.tenderers.teamMember", "_id email name")
            .populate("builders.inviter", "_id email name")
            .populate("architects.tenderers._id", "_id email name")
            .populate("architects.tenderers.teamMember", "_id email name")
            .populate("architects.inviter", "_id email name")
            .populate("clients.tenderers._id", "_id email name")
            .populate("clients.tenderers.teamMember", "_id email name")
            .populate("clients.inviter", "_id email name")
            .populate("subcontractors.tenderers._id", "_id email name")
            .populate("subcontractors.tenderers.teamMember", "_id email name")
            .populate("subcontractors.inviter", "_id email name")
            .populate("consultants.tenderers._id", "_id email name")
            .populate("consultants.tenderers.teamMember", "_id email name")
            .populate("consultants.inviter", "_id email name")
            .populate("project")
            .exec(cb);
        },
        users: function(cb) {
            User.find({projects: req.project._id}, cb);
        }
    }, function(err, result) {
        if (err) {return res.send(500,err);}
        var users = result.users;
        var people = result.people;
        var roles = ["builders", "clients", "architects", "subcontractors", "consultants"];
        async.each(users, function(user, callback) {
            var data = [];
            async.parallel([
                function(cb) {
                    _.each(roles, function(role) {
                        _.each(people[role], function(tender) {
                            // if the current loop user is the inviter
                            if (tender.inviter._id.toString()===user._id.toString()) {
                                _.each(tender.tenderers, function(tenderer) {
                                    if (tenderer._id) {
                                        data.push({
                                            type: "Tender invited",
                                            createdAt: '',
                                            name: "You have invited " + tenderer._id.name + " for tender " + tender.tenderName,
                                            description: '',
                                            url: '',
                                            version: '',
                                            content: ''
                                        });
                                    }
                                });
                            }
                            // if the current loop user is tenderer
                            if (_.findIndex(tender.tenderers, function(tenderer) {
                                if (tenderer._id) {
                                    return tenderer._id._id.toString() === user._id.toString();
                                }
                            }) !== -1) {
                                data.push({
                                    type: "Tenderer",
                                    createdAt: '',
                                    name: "You have been invited by " + tender.inviter.name + " for tender " + tender.tenderName,
                                    description: '',
                                    url: '',
                                    version: '',
                                    content: ''
                                });
                            } else {
                                _.each(tender.tenderers, function(tenderer) {
                                    _.each(tenderer.teamMember, function(member) {
                                        if (member._id.toString() === user._id.toString()) {
                                            data.push({
                                                type: "Tenderer Team Member",
                                                createdAt: '',
                                                name: "You have been invited as a team member for tender " + tender.tenderName,
                                                description: '',
                                                url: '',
                                                version: '',
                                                content: ''
                                            });
                                        }
                                    });
                                });
                            }
                        });
                    });
                    cb();
                },
                function(cb) {
                    Task.find({project: req.params.id, $or:[{owner: user._id}, {members: user._id}]}, function(err, tasks) {
                        if (err || tasks.length === 0) {cb();}
                        else {
                        _.each(tasks, function(task) {
                            data.push({
                                type: "Task",
                                createdAt: moment(task.createdAt).format("MM-DD-YYYY"),
                                name: task.name,
                                description: task.description,
                                url: '',
                                version: '',
                                content: ''
                            });
                        });
                        cb(null,data);
                        }
                    });
                },
                function(cb) {
                    File.find({
                    project: req.params.id, 
                    $or:[{"element.type":"file", $or:[{members: user._id}, {owner: user._id}]}, 
                        {"element.type":"document"}]}, function(err, files) {
                        if (err || files.length === 0) {cb();}
                        else {
                            _.each(files, function(file) {
                                data.push({
                                    type: (file.element.type === "file") ? "File" : "Document",
                                    createdAt: moment(file.createdAt).format("MM-DD-YYYY"),
                                    name: file.name,
                                    description: file.description,
                                    url: file.path,
                                    version: file.version,
                                    content: ''
                                });
                                if (file.fileHistory.length > 0) {
                                    _.each(file.fileHistory, function(history) {
                                        data.push({
                                            type: (file.element.type === "file") ? "File Reversion" : "Document Reversion",
                                            createdAt: moment(history.createdAt).format("MM-DD-YYYY"),
                                            name: history.name,
                                            description: history.description,
                                            url: history.link,
                                            version: history.version,
                                            content: ''
                                        });
                                    });
                                }
                            });
                            cb(null, data);
                        }
                    });
                }, 
                function(cb) {
                    Thread.find({project: req.params.id, $or:[{owner: user._id}, {members: user._id}]})
                    .populate("messages.user")
                    .exec(function(err, threads) {
                        if (err || threads.length === 0) {cb();}
                        else {
                            _.each(threads, function(thread) {
                                data.push({
                                    type: "Thread",
                                    createdAt: moment(thread.createdAt).format("MM-DD-YYYY"),
                                    name: thread.name,
                                    description: thread.description,
                                    url: '',
                                    version: '',
                                    content: ''
                                });
                                if (thread.messages.length > 0) {
                                    _.each(thread.messages, function(message) {
                                        data.push({
                                            type: "Thread Message Detail",
                                            createdAt: moment(message.sendAt).format("MM-DD-YYYY"),
                                            name: thread.name,
                                            description: thread.description,
                                            url: '',
                                            version: '',
                                            content: message.user.name + " said: " + message.text
                                        });
                                    });
                                }
                            });
                            cb(null, data);
                        }
                    });
                }
            ], function(err, result) {
                if (err) {return res.send(500,err);}
                var filename = user._id+"-archive-"+people.project.name+".csv"
                json2csv({data: data}, function(err, csv) {
                    if (err) {console.log(err);}
                    fs.writeFile(filename, csv, function(err) {
                        if (err) 
                            throw err;
                        S3.uploadFile({path: config.newRoot+filename, name: filename}, function(err, data) {
                            if (err) {console.log(err);return res.send(err);}
                            var link = S3.getPublicUrl(filename);
                            Mailer.sendMail('download-project-data.html', config.emailFrom, user.email, {
                                user: user.toJSON(),
                                link: link,
                                subject: 'Archived data for ' + people.project.name
                            },function(err){
                                console.log(err);
                                fs.unlinkSync(config.newRoot+filename);
                                callback();
                            });
                        });
                    });
                });
            });
        }, function() {
            return res.send(200, people.project);
        });
    });
};

exports.backup = function(req, res) {
    var user = req.user;
    var roles = ["builders", "clients", "architects", "subcontractors", "consultants"];
    async.parallel({
        project: function(cb) {
            Project.findById(req.params.id, cb);
        },
        people: function(cb) {
            People.findOne({project: req.params.id})
            .populate("builders.tenderers._id", "_id email name")
            .populate("architects.tenderers._id", "_id email name")
            .populate("clients.tenderers._id", "_id email name")
            .populate("subcontractors.tenderers._id", "_id email name")
            .populate("consultants.tenderers._id", "_id email name")
            .exec(cb);
        }
    }, function(err, result) {
        if (err) {return res.send(err);}
        else {
            var project = result.project;
            var people = result.people;
            var data = [];
            var isAvailableUser = false;
            _.each(roles, function(role) {
                _.each(people[role], function(tender) {
                    var currentUserIndex = _.findIndex(tender.tenderers, function(tenderer) {
                        if (tenderer._id) {
                            return tenderer._id._id.toString() === user._id.toString();
                        }
                    });
                    if (currentUserIndex !== -1) {
                        isAvailableUser = true;
                        return false;
                    } 
                });
            });
            if (isAvailableUser) {
                async.parallel([
                    function(cb) {
                        Task.find({project: req.params.id, $or:[{owner: user._id}, {members: user._id}]}, function(err, tasks) {
                            if (err || tasks.length === 0) {cb();}
                            _.each(tasks, function(task) {
                                data.push({
                                    type: "Task",
                                    createdAt: moment(task.createdAt).format("MM-DD-YYYY"),
                                    name: task.name,
                                    description: task.description,
                                    url: '',
                                    version: '',
                                    content: ''
                                });
                            });
                            cb(null,data);
                        });
                    },
                    function(cb) {
                        File.find({
                        project: req.params.id, 
                        $or:[{"element.type":"file", $or:[{members: user._id}, {owner: user._id}]}, 
                            {"element.type":"document"}]}, function(err, files) {
                            if (err || files.length === 0) {cb();}
                            _.each(files, function(file) {
                                data.push({
                                    type: (file.element.type === "file") ? "File" : "Document",
                                    createdAt: moment(file.createdAt).format("MM-DD-YYYY"),
                                    name: file.name,
                                    description: file.description,
                                    url: file.path,
                                    version: file.version,
                                    content: ''
                                });
                                if (file.fileHistory.length > 0) {
                                    _.each(file.fileHistory, function(history) {
                                        data.push({
                                            type: (file.element.type === "file") ? "File Reversion" : "Document Reversion",
                                            createdAt: moment(history.createdAt).format("MM-DD-YYYY"),
                                            name: history.name,
                                            description: history.description,
                                            url: history.link,
                                            version: history.version,
                                            content: ''
                                        });
                                    });
                                }
                            });
                            cb(null, data);
                        });
                    }, 
                    function(cb) {
                        Thread.find({project: req.params.id, $or:[{owner: user._id}, {members: user._id}]})
                        .populate("messages.user")
                        .exec(function(err, threads) {
                            if (err || threads.length === 0) {cb();}
                            _.each(threads, function(thread) {
                                data.push({
                                    type: "Thread",
                                    createdAt: moment(thread.createdAt).format("MM-DD-YYYY"),
                                    name: thread.name,
                                    description: thread.description,
                                    url: '',
                                    version: '',
                                    content: ''
                                });
                                if (thread.messages.length > 0) {
                                    _.each(thread.messages, function(message) {
                                        data.push({
                                            type: "Thread Message Detail",
                                            createdAt: moment(message.sendAt).format("MM-DD-YYYY"),
                                            name: thread.name,
                                            description: thread.description,
                                            url: '',
                                            version: '',
                                            content: message.user.name + "said: " + message.text
                                        });
                                    });
                                }
                            });
                            cb(null, data);
                        });
                    }
                ], function(err, result) {
                    if (err) {console.log(err);return res.send(500,err);}
                    var filename = user._id+"-"+project.name+".csv";
                    json2csv({data: data}, function(err, csv) {
                        if (err) {console.log(err);}
                        fs.writeFile(filename, csv, function(err) {
                            if (err) 
                                throw err;
                            S3.uploadFile({path: config.newRoot+filename, name: filename}, function(err, data) {
                                if (err) {console.log(err);return res.send(err);}
                                var link = S3.getPublicUrl(filename);
                                Mailer.sendMail('download-project-data.html', config.emailFrom, user.email, {
                                    user: user.toJSON(),
                                    link: link,
                                    subject: 'Requested a backup for ' + project.name
                                },function(err){
                                    console.log(err);
                                    fs.unlinkSync(config.newRoot+filename);
                                    return res.send(200);
                                });
                            });
                        });
                    });
                });
            } else {
                return res.send(500, {message: "You have no privilege to download project backup"})
            }
        }
    });
};

exports.getLimitedProjectNumber = function(req, res) {
    LimitProject.find({}, function(err, limitProject) {
        if (err) {return res.send(500,err);}
        return res.send(200, limitProject[0]);
    });
};

exports.changeLimitedProjectNumber = function(req, res) {
    LimitProject.find({}, function(err, limitProjects) {
        if (err) {return res.send(500,err);}
        if (limitProjects.length === 0) {
            var limitProject = new LimitProject({
                number: req.body.number
            });
            limitProject.save(function(err){
                if (err) {return res.send(500,err);}
                return res.send(200,limitProject);
            });
        } else {
            limitProjects[0].number = req.body.number;
            limitProjects[0].save(function(err, limitProject) {
                if (err) {return res.send(500,err);}
                return res.send(200,limitProject);
            });
        }
    });
};