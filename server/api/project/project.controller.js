'use strict';

var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var Notification = require('./../../models/notification.model');
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

// create new project and people package with project manager
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
        if (!user.team._id) {
            return res.send(500, {message: "You cann\'t create a project when not in any teams"});
        }
        LimitProject.findOne({team: user.team._id}, function(err, limitProject) {
            var maximunFreeProjects;
            if (err) {return res.send(500,err);}
            if (!limitProject) {
                maximunFreeProjects = 1;
            } else {
                maximunFreeProjects = limitProject.number;
            }
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
                    return res.send(500, {msg: "You Have Reached the Limit of Free Projects. Please Upgrade Your Subscription to Continue..."});
                } else {
                    return res.send(500, {msg: "You Have Reached the Limit of Projects In Your Subscription. Please Upgrade to Continue..."});
                }
            }
        })
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
            Notification.find({owner: req.user._id, unread: true, "element.project": project._id, $or:[{referenceTo: "task"}, {referenceTo: "thread"}, {referenceTo: "file"}, {referenceTo: "document"}]}, function(err, notifications) {
                if (err) {return res.send(500,err);}
                var tasks = [];
                var threads = [];
                var files = [];
                var documents = [];
                _.each(notifications, function(notification) {
                    if (notification.referenceTo === "task") {
                        tasks.push(notification);
                    } else if (notification.referenceTo === "thread") {
                        threads.push(notification);
                    } else if (notification.referenceTo === "file") {
                        files.push(notification);
                    } else {
                        documents.push(notification);
                    }
                });
                var uniqTasks = _.map(_.groupBy(tasks,function(doc){
                    return doc.element._id;
                }),function(grouped){
                  return grouped[0];
                });
                var uniqThreads = _.map(_.groupBy(threads,function(doc){
                    return doc.element._id;
                }),function(grouped){
                  return grouped[0];
                });
                var uniqFiles = _.map(_.groupBy(files,function(doc){
                    return doc.element._id;
                }),function(grouped){
                  return grouped[0];
                });
                var uniqDocuments = _.map(_.groupBy(documents,function(doc){
                    return doc.element._id;
                }),function(grouped){
                  return grouped[0];
                });
                project.element = {
                    totalTasks: uniqTasks.length,
                    totalMessages: uniqThreads.length,
                    totalFiles: uniqFiles.length,
                    totalDocuments: uniqDocuments.length,
                };
                return res.send(200, project);
            });
        }
    });
};

// get all projects
// restrict admin only
exports.getAll = function(req, res) {
    var query = (req.query.userId) ? {owner: req.query.userId} : {};
    Project.find(query, function(err, projects){
        if (err) {return res.send(500,err);}
        return res.send(200,projects)
    });
};

// remove project
// restrict admin only
exports.destroy = function (req, res) {
    Project.findByIdAndRemove(req.params.id, function (err, project) {
        if (err) {
            return res.send(500, err);
        }
        return res.send(200);
    });
};

// update the project information 
// restrict project manager or admin
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
// Change date to DD/MM/YYYY hh:mm:ss
function changeDateToMiniFormat(date) {
    return moment(date).format("DD/MM/YYYY HH:mm:ss");
};

// Change date to MMM Do, YYYY
function changeDateToFullFormat(Date) {
    return moment().format("MMM Do, YYYY");
};

// this function fire when update project status to archive
// it send an excel file to users whose related to that project
function sendInfoToUser(req, res) {
    async.parallel({
        people: function(cb) {
            People.findOne({project: req.project._id})
            .populate("builders.tenderers._id", "_id email name phoneNumber")
            .populate("builders.tenderers.teamMember", "_id email name phoneNumber")
            .populate("builders.inviter", "_id email name phoneNumber")
            .populate("architects.tenderers._id", "_id email name phoneNumber")
            .populate("architects.tenderers.teamMember", "_id email name phoneNumber")
            .populate("architects.inviter", "_id email name phoneNumber")
            .populate("clients.tenderers._id", "_id email name phoneNumber")
            .populate("clients.tenderers.teamMember", "_id email name phoneNumber")
            .populate("clients.inviter", "_id email name phoneNumber")
            .populate("subcontractors.tenderers._id", "_id email name phoneNumber")
            .populate("subcontractors.tenderers.teamMember", "_id email name phoneNumber")
            .populate("subcontractors.inviter", "_id email name phoneNumber")
            .populate("consultants.tenderers._id", "_id email name phoneNumber")
            .populate("consultants.tenderers.teamMember", "_id email name phoneNumber")
            .populate("consultants.inviter", "_id email name phoneNumber")
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
                    var fields = ["Project Name", "Project Address", "Project Description"];
                    json2csv({data: [{"Project Name": req.project.name, "Project Address": req.project.address, "Project Description": req.project.description}], fields: fields}, function(err, csv) {
                        if (err) {cb(err);}
                        else {
                            var filename = user._id+"-"+req.project._id+"-archive-overview.csv";
                            fs.writeFile(config.newRoot+filename, csv, function(err){
                                if (err) {cb(err);}
                                data.push(filename);
                                cb(null);
                            });
                        }
                    });
                },
                function(cb) {
                    var team = [];
                    _.each(roles, function(role) {
                        _.each(people[role], function(tender) {
                            if (tender.hasSelect && tender.tenderers[0]._id && tender.tenderers[0]._id._id.toString()===user._id.toString()) {
                                team.push({"Member Name": user.name, "Email": user.email, "Phone Number": user.phoneNumber, "Team Type": role});
                                _.each(tender.tenderers[0].teamMember, function(member) {
                                    team.push({"Member Name": member.name, "Email": member.email, "Phone Number": member.phoneNumber, "Team Type": role});
                                });
                            } else {
                                if (tender.tenderers && tender.tenderers.length > 0) {
                                    var index = _.findIndex(tender.tenderers[0].teamMember, function(member) {
                                        return member._id.toString()===user._id.toString();
                                    });
                                    if (index !== -1) {
                                        team.push({"Member Name": tender.tenderers[0]._id.name, "Email": tender.tenderers[0]._id.email, "Phone Number": tender.tenderers[0]._id.phoneNumber, "Team Type": role});
                                        _.each(tender.tenderers[0].teamMember, function(member) {
                                            team.push({"Member Name": member.name, "Email": member.email, "Phone Number": member.phoneNumber, "Team Type": role});
                                        });
                                    }
                                }
                            }
                        });
                    });
                    var fields = ["Member Name", "Email", "Phone Number", "Team Type"];
                    json2csv({data: team, fields: fields}, function(err, csv) {
                        if (err) {cb(err);}
                        else {
                            var filename = user._id+"-"+req.project._id+"-archive-team.csv";
                            fs.writeFile(config.newRoot+filename, csv, function(err){
                                if (err) {cb(err);}
                                data.push(filename);
                                cb(null);
                            });
                        }
                    });
                },
                function(cb) {
                    var threadsData = [];
                    Thread.find({project: req.project._id, $or:[{owner: user._id}, {members: user._id}]})
                    .populate("members")
                    .populate("activities.user")
                    .exec(function(err, threads) {
                        if (err) {cb(err);}
                        else {
                            _.each(threads, function(thread) {
                                var threadMembers ="";
                                _.each(thread.members, function(member) {
                                    threadMembers += member.name + ", ";
                                });
                                threadsData.push({"Thread Name": thread.name, "Assignees": threadMembers, "Activity Time": changeDateToMiniFormat(thread.createdAt), "Activity Description": "This message thread was created on "+changeDateToFullFormat(thread.createdAt), "Activity Detail": "N/A"});
                                _.each(thread.activities, function(activity) {
                                    if (activity.type==="chat") {
                                        threadsData.push({"Thread Name": thread.name, "Assignees": threadMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " replied to this message thread at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(thread.createdAt), "Activity Detail": activity.element.message});
                                    } else if (activity.type==="assign") {
                                        var assignees="";
                                        _.each(activity.element.invitees, function(assignee) {
                                            assignees += assignee + ", ";
                                        });
                                        threadsData.push({"Thread Name": thread.name, "Assignees": threadMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " assigned new members this message thread at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(thread.createdAt), "Activity Detail": assignees});
                                    } else if (activity.type==="related-task") {
                                        threadsData.push({"Thread Name": thread.name, "Assignees": threadMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " created new related task for this message thread at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(thread.createdAt), "Activity Detail": "Task "+activity.element.name});
                                    } else if (activity.type==="related-file") {
                                        threadsData.push({"Thread Name": thread.name, "Assignees": threadMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " created new related file for this message thread at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(thread.createdAt), "Activity Detail": "File "+activity.element.name});                                    
                                    } else if (activity.type==="archive") {
                                        threadsData.push({"Thread Name": thread.name, "Assignees": threadMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " archived this message thread at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(thread.createdAt), "Activity Detail": "N/a"});                                    
                                    } else if (activity.type==="unarchive") {
                                        threadsData.push({"Thread Name": thread.name, "Assignees": threadMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " unarchived this message thread at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(thread.createdAt), "Activity Detail": "N/a"});                                    
                                    }
                                });
                            });
                            var fields = ["Thread Name", "Assignees", "Activity Time", "Activity Description", "Activity Detail"];
                            json2csv({data: threadsData, fields: fields}, function(err, csv) {
                                if (err) {cb(err);}
                                else {
                                    var filename = user._id+"-"+req.project._id+"-archive-threads.csv";
                                    fs.writeFile(config.newRoot+filename, csv, function(err){
                                        if (err) {cb(err);}
                                        else {
                                            data.push(filename);
                                            cb(null);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }, 
                function(cb) {
                    var taskDatas = [];
                    Task.find({project: req.project._id, $or:[{members: user._id}, {owner: user._id}]})
                    .populate("members")
                    .populate("activities.user")
                    .exec(function(err, tasks) {
                        if (err) {cb(err);}
                        else {
                            _.each(tasks, function(task) {
                                var taskMembers ="";
                                _.each(task.members, function(member) {
                                    taskMembers += member.name + ", ";
                                });
                                taskDatas.push({"Task Description": task.description, "Assignees": taskMembers, "Activity Time": changeDateToMiniFormat(task.createdAt), "Activity Description": "This task was created on "+changeDateToFullFormat(task.createdAt), "Activity Detail": "N/A"});
                                _.each(task.activities, function(activity) {
                                    if (activity.type==="edit-task") {
                                        var editedString = "";
                                        if (activity.element.description) {
                                            editedString += "Description: " + activity.element.description + ", ";
                                        } 
                                        if (activity.element.dateEnd) {
                                            editedString += "Date End: " + moment(activity.element.dateEnd).format("DD/MM/YYYY");
                                        }
                                        taskDatas.push({"Task Description": task.description, "Assignees": taskMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " edited this task at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(task.createdAt), "Activity Detail": editedString});
                                    } else if (activity.type==="assign") {
                                        var assignees=""; 
                                        _.each(activity.element.members, function(assignee) {
                                            assignees += assignee + ", ";
                                        });
                                        taskDatas.push({"Task Description": task.description, "Assignees": taskMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " assigned new members this task at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(task.createdAt), "Activity Detail": assignees});
                                    } else if (activity.type==="insert-note") {
                                        taskDatas.push({"Task Description": task.description, "Assignees": taskMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " added new note for this task at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(task.createdAt), "Activity Detail": activity.element.content});
                                    } else if (activity.type==="complete-task") {
                                        taskDatas.push({"Task Description": task.description, "Assignees": taskMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " marked this task as completed at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(task.createdAt), "Activity Detail": "N/A"});
                                    } else if (activity.type==="uncomplete-task") {
                                        taskDatas.push({"Task Description": task.description, "Assignees": taskMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " marked this task as un-complete at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(task.createdAt), "Activity Detail": "N/A"});
                                    }
                                });
                            });
                            var fields = ["Task Description", "Assignees", "Activity Time", "Activity Description", "Activity Detail"];
                            json2csv({data: taskDatas, fields: fields}, function(err, csv) {
                                if (err) {cb(err);}
                                else {
                                    var filename = user._id+"-"+req.project._id+"-archive-tasks.csv";
                                    fs.writeFile(config.newRoot+filename, csv, function(err){
                                        if (err) {cb(err);}
                                        else {
                                            data.push(filename);
                                            cb(null);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }, 
                function(cb) {
                    File.find({project: req.project._id, "element.type":"file", $or:[{owner: user._id},{members:user._id}]})
                    .populate("members")
                    .populate("activities.user")
                    .exec(function(err, files) {
                        if (err) {cb(err);}
                        else {
                            var fileDatas = [];
                            _.each(files, function(file) {
                                var fileMembers ="";
                                _.each(file.members, function(member) {
                                    fileMembers += member.name + ", ";
                                });
                                var fileTags = "";
                                _.each(file.tags, function(tag) {
                                    fileTags += tag + ", ";
                                });
                                fileDatas.push({"File Name": file.name, "Assignees": fileMembers, "Activity Time": changeDateToMiniFormat(file.createdAt), "Activity Description": "This File was created on "+changeDateToFullFormat(file.createdAt), "Activity Detail": "N/A", "URL": "N/A", "Tag": fileTags});
                                _.each(file.activities, function(activity) {
                                    if (activity.type==="upload-reversion") {
                                        var index = _.findIndex(file.fileHistory, function(history) {
                                            if (history.activityAndHisToryId) {
                                                return history.activityAndHisToryId.toString()===activity.activityAndHisToryId.toString();
                                            }
                                        });
                                        if (index !== -1) {
                                            var link = file.fileHistory[index].link;
                                        }
                                        fileDatas.push({"File Name": file.name, "Assignees": fileMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " upload this file reversion at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(file.createdAt), "Activity Detail": "N/A", "URL": (link) ? link : "N/A", "Tags": fileTags});
                                    } else if (activity.type==="insert-note") {
                                        fileDatas.push({"File Name": file.name, "Assignees": fileMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " added a note for this file reversion at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(file.createdAt), "Activity Detail": activity.element.content, "URL": "N/A", "Tags": fileTags});
                                    } else if (activity.type==="archive") {
                                        fileDatas.push({"File Name": file.name, "Assignees": fileMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " archived this file reversion at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(file.createdAt), "Activity Detail": "N/A", "URL": "N/A", "Tags": fileTags});
                                    } else if (activity.type==="unarchived") {
                                        fileDatas.push({"File Name": file.name, "Assignees": fileMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " unarchived this file reversion at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(file.createdAt), "Activity Detail": "N/A", "URL": "N/A", "Tags": fileTags});
                                    }
                                });
                            });
                            var fields = ["File Name", "Assignees", "Activity Time", "Activity Description", "Activity Detail", "URL", "Tags"];
                            json2csv({data: fileDatas, fields: fields}, function(err, csv) {
                                if (err) {cb(err);}
                                else {
                                    var filename = user._id+"-"+req.project._id+"-archive-files.csv";
                                    fs.writeFile(config.newRoot+filename, csv, function(err){
                                        if (err) {cb(err);}
                                        else {
                                            data.push(filename);
                                            cb(null);
                                        }
                                    });
                                }
                            });
                        }
                    });
                },
                function(cb) {
                    File.find({project: req.project._id, "element.type":"document", $or:[{owner: user._id},{"fileHistory.members._id":user._id}]})
                    .populate("members")
                    .populate("activities.user")
                    .populate("fileHistory.members._id")
                    .exec(function(err, files) {
                        if (err) {cb(err);}
                        else {
                            var documentDatas = [];
                            _.each(files, function(file) {
                                documentDatas.push({"Document Name": file.name, "Activity Time": changeDateToMiniFormat(file.createdAt), "Activity Description": "This Document was created on "+changeDateToFullFormat(file.createdAt), "Activity Detail": "N/A", "URL": "N/A", "Version Tag": "N/a", "Assignees": "N/a"});
                                _.each(file.activities, function(activity) {
                                    if (activity.type==="upload-reversion") {
                                        var index = _.findIndex(file.fileHistory, function(history) {
                                            if (history.activityAndHisToryId) {
                                                return history.activityAndHisToryId.toString()===activity.activityAndHisToryId.toString();
                                            }
                                        });
                                        if (index !== -1) {
                                            var link = file.fileHistory[index].link;
                                            var versionMembers = "";
                                            var versionTags = file.fileHistory[index].versionTags[0];
                                            _.each(file.fileHistory[index].members, function(member) {
                                                if (member._id) {
                                                    versionMembers += member._id.name + ", ";
                                                }
                                            });
                                        }
                                        documentDatas.push({"Document Name": file.name, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " upload this document reversion at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(file.createdAt), "Activity Detail": "N/A", "URL": (link) ? link : "N/A", "Version Tag": versionTags, "Assignees": versionMembers});
                                    } else if (activity.type==="archive") {
                                        documentDatas.push({"Document Name": file.name, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " archived this document at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(file.createdAt), "Activity Detail": "N/A", "URL": "N/A", "Version Tags": "N/A", "Assignees": "N/A"});
                                    } else if (activity.type==="unarchived") {
                                        documentDatas.push({"Document Name": file.name, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " unarchived this document at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(file.createdAt), "Activity Detail": "N/A", "URL": "N/A", "Version Tags": "N/A", "Assignees": "N/A"});
                                    }
                                });
                            });
                            var fields = ["Document Name", "Assignees", "Activity Time", "Activity Description", "Activity Detail", "URL", "Tags"];
                            json2csv({data: documentDatas, fields: fields}, function(err, csv) {
                                if (err) {cb(err);}
                                else {
                                    var filename = user._id+"-"+req.project._id+"-archive-documents.csv";
                                    fs.writeFile(config.newRoot+filename, csv, function(err){
                                        if (err) {cb(err);}
                                        else {
                                            data.push(filename);
                                            cb(null);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            ], function(err, result) {
                if (err) {return res.send(500,err);}
                var links = [];
                async.each(data, function(file, cb) {
                    S3.uploadFile({path: config.newRoot+file, name: file}, function(err, data) {
                        if (err) {cb(err);}
                        else {
                            var type = "";
                            if (file.search("tasks") !== -1) {
                                type = "Tasks";
                            } else if (file.search("threads") !== -1) {
                                type = "Threads";
                            } else if (file.search("files") !== -1) {
                                type = "Files";
                            } else if (file.search("documents") !== -1) {
                                type = "Documents";
                            } else if (file.search("overview") !== -1) {
                                type = "Overview";
                            } else if (file.search("team") !== -1) {
                                type = "Team";
                            }
                            links.push({type: type, url: S3.getPublicUrl(file)});
                            cb(null);
                        }
                    });
                }, function() {
                    Mailer.sendMail('download-project-data.html', config.emailFrom, user.email, {
                        user: user.toJSON(),
                        links: links,
                        subject: 'Archived data for ' + req.project.name
                    },function(err){
                        _.each(data, function(d) {
                            fs.unlinkSync(config.newRoot+d);
                        });
                        callback();
                    });
                });
            });
        }, function() {
            return res.send(200, people.project);
        });
    });
};

// send an backup with excel file to the requested user.
// the backup include: threads, tasks, files, documentations
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
                        var threadsData = [];
                        Thread.find({project: project._id, $or:[{owner: user._id}, {members: user._id}]})
                        .populate("members")
                        .populate("activities.user")
                        .exec(function(err, threads) {
                            if (err) {cb(err);}
                            else {
                                _.each(threads, function(thread) {
                                    var threadMembers ="";
                                    _.each(thread.members, function(member) {
                                        threadMembers += member.name + ", ";
                                    });
                                    threadsData.push({"Thread Name": thread.name, "Assignees": threadMembers, "Activity Time": changeDateToMiniFormat(thread.createdAt), "Activity Description": "This message thread was created on "+changeDateToFullFormat(thread.createdAt), "Activity Detail": "N/A"});
                                    _.each(thread.activities, function(activity) {
                                        if (activity.type==="chat") {
                                            threadsData.push({"Thread Name": thread.name, "Assignees": threadMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " replied to this message thread at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(thread.createdAt), "Activity Detail": activity.element.message});
                                        } else if (activity.type==="assign") {
                                            var assignees="";
                                            _.each(activity.element.invitees, function(assignee) {
                                                assignees += assignee + ", ";
                                            });
                                            threadsData.push({"Thread Name": thread.name, "Assignees": threadMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " assigned new members this message thread at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(thread.createdAt), "Activity Detail": assignees});
                                        } else if (activity.type==="related-task") {
                                            threadsData.push({"Thread Name": thread.name, "Assignees": threadMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " created new related task for this message thread at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(thread.createdAt), "Activity Detail": "Task "+activity.element.name});
                                        } else if (activity.type==="related-file") {
                                            threadsData.push({"Thread Name": thread.name, "Assignees": threadMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " created new related file for this message thread at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(thread.createdAt), "Activity Detail": "File "+activity.element.name});                                    
                                        } else if (activity.type==="archive") {
                                            threadsData.push({"Thread Name": thread.name, "Assignees": threadMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " archived this message thread at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(thread.createdAt), "Activity Detail": "N/a"});                                    
                                        } else if (activity.type==="unarchive") {
                                            threadsData.push({"Thread Name": thread.name, "Assignees": threadMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " unarchived this message thread at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(thread.createdAt), "Activity Detail": "N/a"});                                    
                                        }
                                    });
                                });
                                var fields = ["Thread Name", "Assignees", "Activity Time", "Activity Description", "Activity Detail"];
                                json2csv({data: threadsData, fields: fields}, function(err, csv) {
                                    if (err) {cb(err);}
                                    else {
                                        var filename = user._id+"-"+project._id+"-archive-threads.csv";
                                        fs.writeFile(config.newRoot+filename, csv, function(err){
                                            if (err) {cb(err);}
                                            else {
                                                data.push(filename);
                                                cb(null);
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }, 
                    function(cb) {
                        var taskDatas = [];
                        Task.find({project: project._id, $or:[{members: user._id}, {owner: user._id}]})
                        .populate("members")
                        .populate("activities.user")
                        .exec(function(err, tasks) {
                            if (err) {cb(err);}
                            else {
                                _.each(tasks, function(task) {
                                    var taskMembers ="";
                                    _.each(task.members, function(member) {
                                        taskMembers += member.name + ", ";
                                    });
                                    taskDatas.push({"Task Description": task.description, "Assignees": taskMembers, "Activity Time": changeDateToMiniFormat(task.createdAt), "Activity Description": "This task was created on "+changeDateToFullFormat(task.createdAt), "Activity Detail": "N/A"});
                                    _.each(task.activities, function(activity) {
                                        if (activity.type==="edit-task") {
                                            var editedString = "";
                                            if (activity.element.description) {
                                                editedString += "Description: " + activity.element.description + ", ";
                                            } 
                                            if (activity.element.dateEnd) {
                                                editedString += "Date End: " + moment(activity.element.dateEnd).format("DD/MM/YYYY");
                                            }
                                            taskDatas.push({"Task Description": task.description, "Assignees": taskMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " edited this task at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(task.createdAt), "Activity Detail": editedString});
                                        } else if (activity.type==="assign") {
                                            var assignees=""; 
                                            _.each(activity.element.members, function(assignee) {
                                                assignees += assignee + ", ";
                                            });
                                            taskDatas.push({"Task Description": task.description, "Assignees": taskMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " assigned new members this task at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(task.createdAt), "Activity Detail": assignees});
                                        } else if (activity.type==="insert-note") {
                                            taskDatas.push({"Task Description": task.description, "Assignees": taskMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " added new note for this task at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(task.createdAt), "Activity Detail": activity.element.content});
                                        } else if (activity.type==="complete-task") {
                                            taskDatas.push({"Task Description": task.description, "Assignees": taskMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " marked this task as completed at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(task.createdAt), "Activity Detail": "N/A"});
                                        } else if (activity.type==="uncomplete-task") {
                                            taskDatas.push({"Task Description": task.description, "Assignees": taskMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " marked this task as un-complete at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(task.createdAt), "Activity Detail": "N/A"});
                                        }
                                    });
                                });
                                var fields = ["Task Description", "Assignees", "Activity Time", "Activity Description", "Activity Detail"];
                                json2csv({data: taskDatas, fields: fields}, function(err, csv) {
                                    if (err) {cb(err);}
                                    else {
                                        var filename = user._id+"-"+project._id+"-archive-tasks.csv";
                                        fs.writeFile(config.newRoot+filename, csv, function(err){
                                            if (err) {cb(err);}
                                            else {
                                                data.push(filename);
                                                cb(null);
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }, 
                    function(cb) {
                        File.find({project: project._id, "element.type":"file", $or:[{owner: user._id},{members:user._id}]})
                        .populate("members")
                        .populate("activities.user")
                        .exec(function(err, files) {
                            if (err) {cb(err);}
                            else {
                                var fileDatas = [];
                                _.each(files, function(file) {
                                    var fileMembers ="";
                                    _.each(file.members, function(member) {
                                        fileMembers += member.name + ", ";
                                    });
                                    var fileTags = "";
                                    _.each(file.tags, function(tag) {
                                        fileTags += tag + ", ";
                                    });
                                    fileDatas.push({"File Name": file.name, "Assignees": fileMembers, "Activity Time": changeDateToMiniFormat(file.createdAt), "Activity Description": "This File was created on "+changeDateToFullFormat(file.createdAt), "Activity Detail": "N/A", "URL": "N/A", "Tag": fileTags});
                                    _.each(file.activities, function(activity) {
                                        if (activity.type==="upload-reversion") {
                                            var index = _.findIndex(file.fileHistory, function(history) {
                                                if (history.activityAndHisToryId) {
                                                    return history.activityAndHisToryId.toString()===activity.activityAndHisToryId.toString();
                                                }
                                            });
                                            if (index !== -1) {
                                                var link = file.fileHistory[index].link;
                                            }
                                            fileDatas.push({"File Name": file.name, "Assignees": fileMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " upload this file reversion at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(file.createdAt), "Activity Detail": "N/A", "URL": (link) ? link : "N/A", "Tags": fileTags});
                                        } else if (activity.type==="insert-note") {
                                            fileDatas.push({"File Name": file.name, "Assignees": fileMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " added a note for this file reversion at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(file.createdAt), "Activity Detail": activity.element.content, "URL": "N/A", "Tags": fileTags});
                                        } else if (activity.type==="archive") {
                                            fileDatas.push({"File Name": file.name, "Assignees": fileMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " archived this file reversion at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(file.createdAt), "Activity Detail": "N/A", "URL": "N/A", "Tags": fileTags});
                                        } else if (activity.type==="unarchived") {
                                            fileDatas.push({"File Name": file.name, "Assignees": fileMembers, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " unarchived this file reversion at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(file.createdAt), "Activity Detail": "N/A", "URL": "N/A", "Tags": fileTags});
                                        }
                                    });
                                });
                                var fields = ["File Name", "Assignees", "Activity Time", "Activity Description", "Activity Detail", "URL", "Tags"];
                                json2csv({data: fileDatas, fields: fields}, function(err, csv) {
                                    if (err) {cb(err);}
                                    else {
                                        var filename = user._id+"-"+project._id+"-archive-files.csv";
                                        fs.writeFile(config.newRoot+filename, csv, function(err){
                                            if (err) {cb(err);}
                                            else {
                                                data.push(filename);
                                                cb(null);
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    },
                    function(cb) {
                        File.find({project: project._id, "element.type":"document", $or:[{owner: user._id},{"fileHistory.members._id":user._id}]})
                        .populate("members")
                        .populate("activities.user")
                        .populate("fileHistory.members._id")
                        .exec(function(err, files) {
                            if (err) {cb(err);}
                            else {
                                var documentDatas = [];
                                _.each(files, function(file) {
                                    documentDatas.push({"Document Name": file.name, "Activity Time": changeDateToMiniFormat(file.createdAt), "Activity Description": "This Document was created on "+changeDateToFullFormat(file.createdAt), "Activity Detail": "N/A", "URL": "N/A", "Version Tag": "N/a", "Assignees": "N/a"});
                                    _.each(file.activities, function(activity) {
                                        if (activity.type==="upload-reversion") {
                                            var index = _.findIndex(file.fileHistory, function(history) {
                                                if (history.activityAndHisToryId) {
                                                    return history.activityAndHisToryId.toString()===activity.activityAndHisToryId.toString();
                                                }
                                            });
                                            if (index !== -1) {
                                                var link = file.fileHistory[index].link;
                                                var versionMembers = "";
                                                var versionTags = file.fileHistory[index].versionTags[0];
                                                _.each(file.fileHistory[index].members, function(member) {
                                                    if (member._id) {
                                                        versionMembers += member._id.name + ", ";
                                                    }
                                                });
                                            }
                                            documentDatas.push({"Document Name": file.name, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " upload this document reversion at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(file.createdAt), "Activity Detail": "N/A", "URL": (link) ? link : "N/A", "Version Tag": versionTags, "Assignees": versionMembers});
                                        } else if (activity.type==="archive") {
                                            documentDatas.push({"Document Name": file.name, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " archived this document at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(file.createdAt), "Activity Detail": "N/A", "URL": "N/A", "Version Tags": "N/A", "Assignees": "N/A"});
                                        } else if (activity.type==="unarchived") {
                                            documentDatas.push({"Document Name": file.name, "Activity Time": changeDateToMiniFormat(activity.createdAt), "Activity Description": activity.user.name + " unarchived this document at " +moment(activity.createdAt).format("hh:mm")+ " " +changeDateToFullFormat(file.createdAt), "Activity Detail": "N/A", "URL": "N/A", "Version Tags": "N/A", "Assignees": "N/A"});
                                        }
                                    });
                                });
                                var fields = ["Document Name", "Assignees", "Activity Time", "Activity Description", "Activity Detail", "URL", "Tags"];
                                json2csv({data: documentDatas, fields: fields}, function(err, csv) {
                                    if (err) {cb(err);}
                                    else {
                                        var filename = user._id+"-"+project._id+"-archive-documents.csv";
                                        fs.writeFile(config.newRoot+filename, csv, function(err){
                                            if (err) {cb(err);}
                                            else {
                                                data.push(filename);
                                                cb(null);
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                ], function(err, result) {
                    if (err) {return res.send(500,err);}
                    var links = [];
                    async.each(data, function(file, cb) {
                        S3.uploadFile({path: config.newRoot+file, name: file}, function(err, data) {
                            if (err) {cb(err);}
                            else {
                                var type = "";
                                if (file.search("tasks") !== -1) {
                                    type = "Tasks";
                                } else if (file.search("threads") !== -1) {
                                    type = "Threads";
                                } else if (file.search("files") !== -1) {
                                    type = "Files";
                                } else if (file.search("documents") !== -1) {
                                    type = "Documents";
                                }
                                links.push({type: type, url: S3.getPublicUrl(file)});
                                cb(null);
                            }
                        });
                    }, function() {
                        Mailer.sendMail('download-project-data.html', config.emailFrom, user.email, {
                            user: user.toJSON(),
                            links: links,
                            subject: 'Requested a backup for ' + project.name
                        },function(err){
                            if (err) {return res.send(500,err);}
                            _.each(data, function(d) {
                                fs.unlinkSync(config.newRoot+d);
                            });
                            return res.send(200);
                        });
                    });
                });
            } else {
                return res.send(500, {message: "You have no privilege to download project backup"})
            }
        }
    });
};

// get limited project number for selected team
// restrict admin
exports.getLimitedProjectNumber = function(req, res) {
    LimitProject.findOne({team: req.query.teamId}, function(err, limitProject) {
        if (err) {return res.send(500,err);}
        return res.send(200, limitProject);
    });
};

// update the limited project number for selected team
// restrict admin
exports.changeLimitedProjectNumber = function(req, res) {
    LimitProject.findOne({team: req.body.teamId}, function(err, limitProject) {
        if (err) {return res.send(500,err);}
        if (!limitProject) {
            var limitProject = new LimitProject({
                team: req.body.teamId,
                number: req.body.number
            });
            limitProject.save(function(err){
                if (err) {return res.send(500,err);}
                return res.send(200,limitProject);
            });
        } else {
            limitProjectnumber = req.body.number;
            limitProject.save(function(err, limitProject) {
                if (err) {return res.send(500,err);}
                return res.send(200,limitProject);
            });
        }
    });
};