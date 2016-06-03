'use strict';

var People = require('./../../models/people.model');
var InviteToken = require('./../../models/inviteToken.model');
var User = require('./../../models/user.model');
var File = require('./../../models/file.model');
var Thread = require('./../../models/thread.model');
var Task = require('./../../models/task.model');
var Tender = require('./../../models/tender.model');
var _ = require('lodash');
var async = require('async');
var EventBus = require('../../components/EventBus');

var populatePaths = [
    {path:"builders.tenderers._id", select: "_id email name phoneNumber"},
    {path:"builders.inviter", select: "_id email name phoneNumber"},
    {path:"builders.tenderers.teamMember", select: "_id email name phoneNumber"},
    {path:"builders.inviterActivities.user", select: "_id email name phoneNumber"},
    {path:"architects.tenderers._id", select: "_id email name phoneNumber"},
    {path:"architects.inviter", select: "_id email name phoneNumber"},
    {path:"architects.tenderers.teamMember", select: "_id email name phoneNumber"},
    {path:"architects.inviterActivities.user", select: "_id email name phoneNumber"},
    {path:"clients.tenderers._id", select: "_id email name phoneNumber"},
    {path:"clients.inviter", select: "_id email name phoneNumber"},
    {path:"clients.tenderers.teamMember", select: "_id email name phoneNumber"},
    {path:"clients.inviterActivities.user", select: "_id email name phoneNumber"},
    {path:"subcontractors.tenderers._id", select: "_id email name phoneNumber"},
    {path:"subcontractors.inviter", select: "_id email name phoneNumber"},
    {path:"subcontractors.tenderers.teamMember", select: "_id email name phoneNumber"},
    {path:"subcontractors.inviterActivities.user", select: "_id email name phoneNumber"},
    {path: "consultants.tenderers._id", select: "_id email name phoneNumber"},
    {path:"consultants.inviter", select: "_id email name phoneNumber"},
    {path: "consultants.tenderers.teamMember", select: "_id email name phoneNumber"},
    {path:"consultants.inviterActivities.user", select: "_id email name phoneNumber"},
    {path: "project"}
];

exports.archiveMember = function(req, res) {
    var data = req.body;
    People.findById(req.params.id, function(err, people) {
        if (err) {return res.send(500,err);}
        if (!people) {return res.send(404);}
        _.each(people[data.role], function(tender) {
            if (data.type==="team-member") {
                // if current user is leader and he mark their member as archive
                if (tender.tenderers[0]._id && tender.tenderers[0]._id.toString()===req.user._id.toString()) {
                    var index = _.findIndex(tender.tenderers[0].teamMember, function(member) {
                        return member.toString()===data.selectedUserId.toString();
                    });
                    if (index !== -1) {
                        var archivedTeamMembers = (tender.tenderers[0].archivedTeamMembers) ? tender.tenderers[0].archivedTeamMembers : [];
                        archivedTeamMembers.push(tender.tenderers[0].teamMember[index]);
                        tender.tenderers[0].archivedTeamMembers = archivedTeamMembers;
                        return false;
                    }
                }
            } else {
                // if the current user is inviter and he mark selected tender as archive
                if (tender.tenderers[0]._id && data.selectedUserId && tender.tenderers[0]._id.toString()===data.selectedUserId.toString() && tender.inviter.toString()===req.user._id.toString()) {
                    tender.archive = true;
                    return false;
                } else if (tender.tenderers[0].email && data.selectedUserEmail && tender.tenderers[0].email===data.selectedUserEmail && tender.inviter.toString()===req.user._id.toString()) {
                    tender.archive = true;
                    return false;
                }
            }
        });
        console.log(people[data.role]);
    });
};

/*
    invite users to project team
*/
exports.invitePeople = function(req, res) {
    var invite = req.body;
    People.findOne({project:req.params.id}, function(err, people){
        if (err) {return res.send(500,err);}
        if (!people) {return res.send(404);}
        else {
            var newInviteeNotSignUp = [];
            var newInviteeSignUpAlready = [];
            if (invite.type === "addEmployee") {
                var currentTeam;
                if (invite.teamMember.length == 0) {
                    return res.send(500, "Please check your input");
                }
                _.each(people[invite.inviterType], function(tender) {
                    var tendererIndex = _.findIndex(tender.tenderers, function(tenderer) {
                        if (tenderer._id) {
                            return tenderer._id.toString() === req.user._id.toString();
                        }
                    });
                    if (tendererIndex !== -1) {
                        currentTeam = tender.tenderers[tendererIndex].teamMember;
                        return false;
                    }
                });
                async.each(invite.teamMember, function(member, cb) {
                    currentTeam.push(member._id);
                    newInviteeSignUpAlready.push(member._id);
                    User.findById(member._id, function(err, user) {
                        if (err || !user) {cb();}
                        else {
                            user.projects.push(people.project);
                            user.markModified('projects');
                            user.save(cb());
                        }
                    });
                }, function() {
                    people[invite.inviterType].teamMember = currentTeam;
                    people._newInviteeSignUpAlready = newInviteeSignUpAlready;
                    people._newInviteType = invite.inviterType;
                    people.markModified('invitePeople');
                    people._editUser = req.user;
                    people.save(function(err) {
                        if (err) {return res.send(500,err);}
                        People.populate(people, populatePaths
                        , function(err, people) {
                            return responseWithEachType(people, req, res);
                        });
                    });
                });
            } else {
                var type;
                switch (invite.type) {
                    case "addClient":
                        type = "clients";
                        break;
                    case "addBuilder":
                        type = "builders" ;
                        break;
                    case "addArchitect":
                        type = "architects" ;
                        break;
                    case "addSubcontractor":
                        type = "subcontractors" ;
                        break;
                    case "addConsultant":
                        type = "consultants" ;
                        break;
                    default :
                        break;
                }
                var team = people[type];
                async.parallel([
                    function(cb) {
                        if (!invite.isTender) {
                            var tender = {
                                tenderName: invite.tenderName,
                                tenderDescription: invite.tenderDescription,
                                inviter: req.user._id,
                                tenderers: [],
                                hasSelect: true,
                                isDistribute: true,
                                createAt: new Date(),
                                inviterType: (type == "consultants") ? invite.inviterType : null
                            };
                            User.findOne({email: invite.email}, function(err, user) {
                                if (err) {cb(err);}
                                else if (!user) {
                                    tender.tenderers.push({
                                        email: invite.email,
                                        name: invite.name,
                                        phoneNumber: invite.phoneNumber,
                                        teamMember: []
                                    });
                                    people._updatedTender = tender;
                                    team.push(tender);
                                    cb();
                                } else {
                                    tender.tenderers.push({
                                        _id: user._id,
                                        teamMember: []
                                    });
                                    people._newInviteeSignUpAlready = [user._id];
                                    people._updatedTender = tender;
                                    team.push(tender);
                                    user.projects.push(people.project);
                                    user.markModified("projects");
                                    user.save(cb());
                                }
                            });
                        } else {
                            var tender = {
                                tenderName: invite.tenderName,
                                tenderDescription: invite.tenderDescription,
                                dateEnd: invite.dateEnd,
                                inviter: req.user._id,
                                tenderers: [],
                                createAt: new Date(),
                                inviterType: (type == "consultants") ? invite.inviterType : null,
                                inviterActivities: [],
                                relatedItem: [],
                                addendums: []
                            };
                            var addendum = {
                                user: req.user._id,
                                createdAt: new Date(),
                                element: {
                                    name: invite.tenderName,
                                    description: invite.tenderDescription
                                }
                            };
                            var activity = {
                                user: req.user._id,
                                type: "attach-scope",
                                createdAt: new Date(),
                                element: {
                                    members: [],
                                    content: invite.tenderDescription,
                                    dateEnd: invite.dateEnd
                                }
                            };
                            if (invite.file) {
                                addendum.element.link = activity.element.link = invite.file.url;
                                addendum.element.name = activity.element.name = invite.file.filename;
                                tender.inviterActivities.push(activity);
                                tender.addendums.push(addendum);
                                team.push(tender);
                                cb();
                            } else {
                                tender.inviterActivities.push(activity);
                                tender.addendums.push(addendum);
                                team.push(tender);
                                cb();
                            }
                        }
                    }
                ], function(err, result) {
                    if (err) {return res.send(500,err);}
                    else {
                        people[type] = team;
                        people._newInviteType = type;
                        people.markModified('invitePeople');
                        people._editUser = req.user;
                        people.save(function(err){
                            if (err) {return res.send(500,err);}
                            People.populate(people, populatePaths, function(err, people) {
                                if (people.project.projectManager._id.toString() === req.user._id.toString()) {
                                    return res.send(200,people);
                                } else {
                                    responseWithEachType(people, req, res);
                                }
                            });
                        });
                    }
                });
            }
        }
    });
};

/*
    Get project team members
*/
exports.getInvitePeople = function(req, res) {
    People.findOne({project: req.params.id})
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
    .exec(function(err, people){
        if (err) {return res.send(500,err);}
        if (!people) {return res.send(404);}
        else {
            if (req.query.admin && req.user.role==="admin") {
                return res.send(200,people)
            }
            responseWithEachType(people, req, res);
        }
    });
};

/*
    function to filter out project team consultant type
*/
function filterConsultants(consultants, user) {
    var filtered = [];
    _.each(consultants, function(tender) {
        if (tender.inviter._id.toString()===user._id.toString()) {
            tender.teamMember = [];
            filtered.push(tender);
        }
    });
    return filtered;
};

/*
    function to filter out project team type for current user
*/
function filterCurrentTender(tenders, user) {
    var currentTender = [];
    _.each(tenders, function(tender) {
        var index = _.findIndex(tender.tenderers, function(tenderer) {
            if (tenderer._id) {
                return tenderer._id._id.toString()===user._id.toString();
            } 
        });
        if (index !== -1) {
            currentTender = tender;
            currentTender.tenderers = [tender.tenderers[index]];
        } else {
            _.each(tender.tenderers, function(tenderer) {
                var currentMemberIndex = _.findIndex(tenderer.teamMember, function(member) {
                    return member._id.toString()===user._id.toString();
                });
                if (currentMemberIndex !== -1) {
                    currentTender = tender;
                    currentTenderer.tenderers = [tenderer];
                }
            });
        }
    });
    return currentTender;
};

/*
    function to response correctly logic with each project team type
*/
function responseWithEachType(people, req, res){
    var roles = ["builders", "clients", "architects", "subcontractors", "consultants"];
    var currentUserRole;
    var currentUserTender;
    var isLeader = false;
    _.each(roles, function(role) {
        _.each(people[role], function(tender) {
            var index = _.findIndex(tender.tenderers, function(tenderer) {
                if (tenderer._id) {
                    return tenderer._id._id.toString() === req.user._id.toString();
                }
            });
            if (index !== -1) {
                currentUserRole = role;
                isLeader = true;
                currentUserTender = tender;
                return false;
            } else {
                _.each(tender.tenderers, function(tenderer) {
                    if (_.findIndex(tenderer.teamMember, function(member) {
                        return member._id.toString() === req.user._id.toString();
                    }) !== -1) {
                        currentUserRole = role;
                        currentUserTender = tender;
                        return false;
                    }
                });
            }
        });
    });
    if (isLeader) {
        if (people.project.projectManager.type === "builder") {
            switch (currentUserRole) {
                case 'builders':
                    people.clients.teamMember = [];
                    people.architects.teamMember = [];
                    people.subcontractors.teamMember = [];
                    people.consultants = filterConsultants(people.consultants, req.user);
                    return res.send(200, people)
                    break;
                case 'clients':
                    people.builders.teamMember = [];
                    people.architects = [];
                    people.subcontractors = [];
                    people.consultants = filterConsultants(people.consultants, req.user);
                    people[currentUserRole] = filterCurrentTender(people[currentUserRole], req.user);
                    return res.send(200, people);
                    break;
                case 'architects':
                    people.builders.teamMember = [];
                    people.clients = [];
                    people.subcontractors = [];
                    people.consultants = filterConsultants(people.consultants, req.user);
                    people[currentUserRole] = filterCurrentTender(people[currentUserRole], req.user);
                    return res.send(200, people);
                    break;
                
                default:
                    break;
            }
        } else if (people.project.projectManager.type === "homeOwner") {
            switch (currentUserRole) {
                case 'builders':
                    people.clients.teamMember = [];
                    people.architects = [];
                    people.subcontractors.teamMember = [];
                    people.consultants = filterConsultants(people.consultants, req.user);
                    people[currentUserRole] = filterCurrentTender(people[currentUserRole], req.user);
                    return res.send(200, people)
                    break;
                case 'clients':
                    people.builders.teamMember = [];
                    people.architects.teamMember = [];
                    people.consultants = filterConsultants(people.consultants, req.user);
                    people.subcontractors = [];
                    return res.send(200, people);
                    break;
                case 'architects':
                    people.builders = [];
                    people.clients.teamMember = [];
                    people[currentUserRole] = filterCurrentTender(people[currentUserRole], req.user);
                    people.consultants = filterConsultants(people.consultants, req.user);
                    people.subcontractors = [];
                    return res.send(200, people);
                    break;
                
                default:
                    break;
            }
        } else if (people.project.projectManager.type === "architect") {
            switch (currentUserRole) {
                case 'builders':
                    people.clients = [];
                    people.architects.teamMember = [];
                    people.subcontractors.teamMember = [];
                    people.consultants.teamMember = [];
                    people.consultants = filterConsultants(people.consultants, req.user);
                    people[currentUserRole] = filterCurrentTender(people[currentUserRole], req.user);
                    return res.send(200, people)
                    break;
                case 'clients':
                    people.builders = [];
                    people.architects.teamMember = [];
                    people.consultants = filterConsultants(people.consultants, req.user);
                    people[currentUserRole] = filterCurrentTender(people[currentUserRole], req.user);
                    people.subcontractors = [];
                    return res.send(200, people);
                    break;
                case 'architects':
                    people.builders.teamMember = [];
                    people.clients.teamMember = [];
                    people.consultants = filterConsultants(people.consultants, req.user);
                    people.subcontractors = [];
                    return res.send(200, people);
                    break;
                
                default:
                    break;
            }
        }
        if (currentUserRole === "subcontractors") {
            people.architects = [];
            people.consultants = [];
            people.clients = [];
            var result = [];
            var currentInviterTeam = [];
            var builders = []
            _.each(people.builders, function(item) {
                var inviterIndex = _.findIndex(item.tenderers, function(itemTenderer) {
                    if (itemTenderer._id) {
                        return itemTenderer._id._id.toString() === currentUserTender.inviter._id.toString();
                    }
                });
                if (inviterIndex !== -1) {
                    var currentInviterTeam = [item];
                    currentInviterTeam[0].tenderers = [item.tenderers[inviterIndex]];
                    builders = currentInviterTeam;
                    return false;
                }
            });
            _.each(people.subcontractors, function(tender) {
                var tendererIndex = _.findIndex(tender.tenderers, function(tenderer) {
                    if (tenderer._id) {
                        return tenderer._id._id.toString() == req.user._id;
                    }
                });
                if (tendererIndex !== -1) {
                    var currentTenderer = tender.tenderers[tendererIndex];
                    result = [tender];
                    result[0].tenderers = [];
                    result[0].tenderers.push(currentTenderer);
                    return false;
                }
            });
            people.subcontractors = result;
            people.builders = builders;
            return res.send(200, people);
        } else if (currentUserRole === "consultants") {
            people.subcontractors = [];
            var currentTender = tender;
            currentTender.tenderers = [tender.tenderers[index]];
            people.consultants = currentTender;
            var currentInviterTeam = [];
            var result = [];
            _.each(people[currentTender.inviterType], function(item) {
                var inviterIndex = _.findIndex(item.tenderers, function(itemTenderer) {
                    if (itemTenderer._id) {
                        return itemTenderer._id._id.toString() === currentUserTender.inviter._id.toString();
                    }
                });
                if (inviterIndex !== -1) {
                    var currentInviterTeam = [item];
                    currentInviterTeam[0].tenderers = [item.tenderers[inviterIndex]];
                    result = currentInviterTeam;
                    return false;
                }
            });
            if (currentTender.inviterType === "builders") {
                people.builders = result;
                people.clients = [];
                people.architects = [];
            } else if (currentTender.inviterType === "clients") {
                people.clients = result;
                people.builders = [];
                people.architects = [];
            } else if (currentTender.inviterType === "architects") {
                people.architects = result;
                people.clients = [];
                people.builders = [];
            }
            return res.send(200, people);
        }
    } else {
        Tender.find({project: req.params.id, status: "open", $or: [{owner: req.user._id}, {"members.user": req.user._id}, {"members.teamMember": req.user._id}]}, function(err, tenders) {
            if (err || tenders.length === 0) {
                var newRoles = roles;
                if (currentUserRole) 
                    newRoles.splice(roles.indexOf(currentUserRole),1);
                _.each(newRoles, function(newRole) {
                    people[newRole] = [];
                });
                return res.send(200, people);
            } else {
                var availabelTender;
                _.each(people[tenders[0].ownerType], function(tender) {
                    if (tender.hasSelect && tender.tenderers[0]._id._id.toString()==tenders[0].owner.toString()) {
                        availabelTender = tender;
                        return false;
                    }
                });
                _.each(roles, function(role) {
                    people[role] = [];
                });
                if (availabelTender)
                    people[tenders[0].ownerType].push(availabelTender);
                return res.send(200, people);
            }
        });
    }
};