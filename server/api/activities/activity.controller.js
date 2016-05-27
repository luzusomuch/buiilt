'use strict';

var Activity = require('./../../models/activity.model');
var ActivityValidator = require('./../../validators/activity');
var User = require('./../../models/user.model');
var Thread = require('./../../models/thread.model');
var Task = require('./../../models/task.model');
var File = require('./../../models/file.model');
var People = require('./../../models/people.model');
var Tender = require('./../../models/tender.model');
var CheckMembers = require("./../../components/helpers/checkMembers");
var _ = require('lodash');
var async = require('async');
var moment = require("moment");
var mongoose = require("mongoose");

/*Create new activity or milestone*/
exports.create = function(req, res) {
    ActivityValidator.validateCreate(req, function(err, data) {
        if (err) {return res.send(422, err);}
        var activity = new Activity(data);
        activity.project = req.params.id;
        activity.owner = req.user._id;
        if (!activity.isMilestone) {
            if (moment(moment(data.date.start).format("YYYY-MM-DD")).isAfter(moment(data.date.end).format("YYYY-MM-DD"))) {
                return res.send(422, {msg: "End Date Must Greator Than Start Date"});
            }
            activity.date.start = data.date.start;
            activity.date.end = data.date.end;
        }
        // if (req.body.newMembers.length === 0) {
        //     return res.send(422, {msg: "Please check your new members list"});
        // }
        CheckMembers.check(req.body.newMembers, null, function(result) {
            activity.members = result.members;
            activity.notMembers = result.notMembers;
            activity.save(function(err) {
                if (err) {return res.send(500,err);}
                return res.send(200, activity);
                // var roles = ["builders", "architects", "clients", "subcontractors", "consultants"];
                // People.findOne({project: activity.project}, function(err, people) {
                //     if (err || !people) {return res.send(200,activity);}
                //     var currentRole;
                //     var members = [];
                //     _.each(roles, function(role) {
                //         _.each(people[role], function(tender) {
                //             if (role==="subcontractors" || role==="consultants") {
                //                 if (tender.inviter.toString()===req.user._id.toString()) {
                //                     _.each(tender.tenderers, function(tenderer){
                //                         if (tenderer._id) {
                //                             members.push(tenderer._id);
                //                             if (tenderer.teamMember.length > 0) {
                //                                 _.each(tenderer.teamMember, function(member) {
                //                                     members.push(member);
                //                                 });
                //                             }
                //                         }
                //                     });
                //                 }
                //             } else {
                //                 if (tender.hasSelect && tender.tenderers[0]._id && tender.tenderers[0]._id.toString()===req.user._id.toString()) {
                //                     members.push(tender.tenderers[0]._id);
                //                     if (role==="builders") {
                //                         var builderTeamAllow = ["subcontractors", "consultants"];
                //                         _.each(builderTeamAllow, function(team) {
                //                             _.each(people[team], function(tender) {
                //                                 if (tender.hasSelect && tender.inviter.toString()===req.user._id.toString()) {
                //                                     _.each(tender.tenderers, function(tenderer) {
                //                                         if (tenderer._id) {
                //                                             members.push(tenderer._id);
                //                                             if (tenderer.teamMember.length > 0) {
                //                                                 _.each(tenderer.teamMember, function(member) {
                //                                                     members.push(member);
                //                                                 });
                //                                             }
                //                                         }
                //                                     })
                //                                 }
                //                             });
                //                         });
                //                     } else {
                //                         _.each(people.consultants, function(tender) {
                //                             if (tender.hasSelect && tender.inviter.toString()===req.user._id.toString()) {
                //                                 _.each(tender.tenderers, function(tenderer) {
                //                                     if (tenderer._id) {
                //                                         members.push(tenderer._id);
                //                                         if (tenderer.teamMember.length > 0) {
                //                                             _.each(tenderer.teamMember, function(member) {
                //                                                 members.push(member);
                //                                             });
                //                                         }
                //                                     }
                //                                 })
                //                             }
                //                         });
                //                     }
                //                 }
                //             }
                //         });
                //     });
                //     console.log(members);
                });
            });
        });
    });
};

exports.update = function(req, res) {
    var data = req.body;
    Activity.findById(req.params.id, function(err, activity) {
        if (err) {return res.send(500,err);}
        if (!activity) {return res.send(404);}
        if (activity.owner.toString()!==req.user._id.toString()) {
            return res.send(500, {msg: "Not Allow To Excute"});
        }

        async.parallel([
            function(cb) {
                if (data.editType === "assign-people"){
                    if (data.newMembers && data.newMembers.length === 0) {
                        return res.send(406, {msg: "Please select at least 1 member"});
                    } else {
                        CheckMembers.check(data.newMembers, activity, function(result) {
                            activity.members = result.members;
                            activity.notMembers = result.notMembers;
                            cb();
                        });
                    }
                } else if (data.editType==="insert-activities") {
                    if (data.newActivities && data.newActivities.length===0) {
                        return res.send(406, {msg: "Please select at least 1 activity"});
                    } else {
                        _.each(data.newActivities, function(act) {
                            activity.subActivities.push(act._id);
                        });
                        cb();
                    }
                } else if (data.editType==="change-date-time") {
                    if (data.date) {
                        activity.date = data.date;
                    }
                    cb();
                } else if (data.editType==="change-description") {
                    activity.description = data.description;
                    cb();
                } else {
                    cb();
                }
            }
        ], function() {
            activity.save(function(err) {
                if (err) {return res.send(500,err);}
                return res.send(200, activity);
            });
        });
    });
};

/*Get all activities and milestone related to current user*/
exports.me = function(req, res) {
    var user = req.user;
    var condition = {};
    if (req.params.id!=="me") {
        condition = {project: req.params.id};
    }
    Activity.find(condition)
    .exec(function(err, activities) {
        if (err) {return res.send(500,err);}
        var result = [];
        var roles = ["builders", "architects", "clients", "subcontractors", "consultants"];
        async.each(activities, function(activity, cb) {
            if (!activity.isMilestone) {
                People.findOne({project: activity.project})
                .populate("project")
                .exec(function(err, people) {
                    if (err || !people) {return cb(err);}
                    else {
                        var allow = false;
                        if (activity.owner.toString()===user._id.toString()) {
                            allow = true;
                        } else {
                            var currentTender;
                            var currentRole;
                            _.each(roles, function(role) {
                                _.each(people[role], function(tender) {
                                    if (tender.tenderers[0]._id && tender.tenderers[0]._id.toString()===user._id.toString()) {
                                        currentRole = role;
                                        currentTender = tender;
                                        return false;
                                    } else if (tender.tenderers[0]._id && tender.tenderers[0]._id.toString()!==user._id.toString()) {
                                        var index = _.findIndex(tender.tenderers[0].teamMember, function(member) {
                                            return member.toString()===user._id.toString();
                                        });
                                        if (index !== -1) {
                                            currentRole = role;
                                            currentTender = tender;
                                            return false;
                                        }
                                    } else {

                                    }
                                });
                                if (currentTender) {
                                    return false;
                                }
                            });
                            if (currentTender) {
                                if (people.project.projectManager.type==="builder") {
                                    if (currentTender.inviter.toString()===activity.owner.toString()) {
                                        allow = true;
                                    }
                                } else if (people.project.projectManager.type==="architect" || people.project.projectManager.type==="homeOwner") {
                                    if (currentRole==="subcontractors") {
                                        allow = false;
                                    } else if (currentTender.inviter.toString()===activity.owner.toString()) {
                                        allow = true;
                                    }
                                }
                            }
                        }
                        if (allow) {
                            result.push(activity);
                            cb();
                        } else {
                            cb();
                        }
                    }
                });
            } else {
                cb(null);
            }
        }, function(err) {
            if (err) {return res.send(500,err);}
            return res.send(200, result);
        });
    });
};

var getMainItem = function(type) {
    var _item = {};
    switch (type) {
        case 'thread' :
            _item = Thread;
            break;
        case 'task' :
            _item = Task;
            break;
        case "file":
            _item = File
            break;
        default :
            break;
    }
    return _item;
};

/*Get activity detail*/
exports.get = function(req, res) {
    Activity.findById(req.params.id)
    .populate("members", "_id name email phoneNumber")
    .populate("owner", "_id name email phoneNumber")
    .exec(function(err, activity) {
        if (err) {return res.send(500,err);}
        if (!activity) {return res.send(404, {msg: "The selected item not found"});}
        activity.relatedItem = [];
        async.parallel([
            function (cb) {
                Task.find({project: activity.project, event: activity._id, $or:[{owner: req.user._id}, {members: req.user._id}]}, "_id description event project", function(err, tasks) {
                    if (err) {return cb(err);}
                    else {
                        _.each(tasks, function(task) {
                            if (task.event && task.event.toString()===activity._id.toString()) {
                                activity.relatedItem.push({type: "task", item: task});
                            }
                        });
                        cb(null);
                    }
                });
            }, 
            function (cb) {
                File.find({project: activity.project, event: activity._id, $or:[{owner: req.user._id}, {members: req.user._id}]}, "_id name event project", function(err, files) {
                    if (err) {return cb(err);}
                    else {
                        _.each(files, function(file) {
                            if (file.event && file.event.toString()===activity._id.toString()) {
                                activity.relatedItem.push({type: "file", item: file});
                            }
                        });
                        cb(null);
                    }
                });
            },
            function (cb) {
                Tender.find({project: activity.project, event: activity._id, $or:[{owner: req.user._id}, {"members.user": req.user._id}]}, "_id name event project", function(err, tenders) {
                    if (err) {return cb(err);}
                    else {
                        _.each(tenders, function(tender) {
                            if (tender.event && tender.event.toString()===activity._id.toString()) {
                                activity.relatedItem.push({type: "tender", item: tender});
                            }
                        });
                        cb(null);
                    }
                });
            },
            function (cb) {
                Thread.find({project: activity.project, event: activity._id, $or:[{owner: req.user._id}, {members: req.user._id}]}, "_id name event project", function(err, threads) {
                    if (err) {return cb(err);}
                    else {
                        _.each(threads, function(thread) {
                            if (thread.event && thread.event.toString()===activity._id.toString()) {
                                activity.relatedItem.push({type: "thread", item: thread});
                            }
                        });
                        cb(null);
                    }
                });
            }
        ], function(err) {
            if (err) {return res.send(500,err);}
            return res.send(200, activity);
        });
    });
};