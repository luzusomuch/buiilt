'use strict';

var People = require('./../../models/people.model');
var InviteToken = require('./../../models/inviteToken.model');
var User = require('./../../models/user.model');
var File = require('./../../models/file.model');
var Thread = require('./../../models/thread.model');
var Task = require('./../../models/task.model');
var _ = require('lodash');
var async = require('async');
var EventBus = require('../../components/EventBus');

var populatePaths = [
    {path:"builders.tenderers._id", select: "_id email name"},
    {path:"builders.inviter", select: "_id email name"},
    {path:"builders.tenderers.teamMember", select: "_id email name"},
    {path:"builders.inviterActivities.user", select: "_id email name"},
    {path:"architects.tenderers._id", select: "_id email name"},
    {path:"architects.inviter", select: "_id email name"},
    {path:"architects.tenderers.teamMember", select: "_id email name"},
    {path:"architects.inviterActivities.user", select: "_id email name"},
    {path:"clients.tenderers._id", select: "_id email name"},
    {path:"clients.inviter", select: "_id email name"},
    {path:"clients.tenderers.teamMember", select: "_id email name"},
    {path:"clients.inviterActivities.user", select: "_id email name"},
    {path:"subcontractors.tenderers._id", select: "_id email name"},
    {path:"subcontractors.inviter", select: "_id email name"},
    {path:"subcontractors.tenderers.teamMember", select: "_id email name"},
    {path:"subcontractors.inviterActivities.user", select: "_id email name"},
    {path: "consultants.tenderers._id", select: "_id email name"},
    {path:"consultants.inviter", select: "_id email name"},
    {path: "consultants.tenderers.teamMember", select: "_id email name"},
    {path:"consultants.inviterActivities.user", select: "_id email name"},
    {path: "project"}
];

exports.invitePeople = function(req, res) {
    var invite = req.body;
    console.log(invite);
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

exports.selectWinnerTender = function(req, res) {
    console.log(req.body);
    if (!req.body._id) {
        return res.send(500, {msg: "This user is not registry"});
    } else {
        People.findOne({project: req.params.id}, function(err, people) {
            if (err) {return res.send(500,err);}
            if (!people) {return res.send(404);}
            else {
                var winnerTenderNotification = [];
                var loserTender = [];
                var roles = ["builders", "subcontractors", "consultants"];
                var currentRole;
                _.each(roles, function(role) {
                    var allow = false;
                    if (role === "subcontractors") {
                        _.each(people.builders, function(tender) {
                            var builderTenderIndex = _.findIndex(tender.tenderers, function(tenderer){
                                if (tenderer._id) {
                                    return tenderer._id.toString()===req.user._id.toString();
                                }
                            });
                            if (builderTenderIndex !== -1) {
                                allow = tender.hasSelect;
                                return false;
                            }
                        });
                    } else {
                        allow = true;
                    }
                    if (allow) {
                        _.each(people[role], function(tender) {
                            var index = _.findIndex(tender.tenderers, function(tenderer) {
                                if (tenderer._id && req.body._id) {
                                    return tenderer._id.toString() == req.body._id._id;
                                } else {
                                    return tenderer.email === req.body.email;
                                }
                            });
                            if (index != -1) {
                                var winner = tender.tenderers[index];

                                tender.hasSelect = true;
                                winnerTenderNotification.push(winner._id);
                                _.remove(tender.tenderers, function(tenderer) {
                                    if (tenderer._id)
                                        return tenderer._id.toString() == winner._id;
                                });
                                async.each(tender.tenderers, function(loserTenderer, cb) {
                                    if (loserTenderer._id) {
                                        InviteToken.findOne({type: "project-invite", user: loserTenderer._id, 'element.project': people.project}).remove(function(err) {
                                            if (err) {cb();}
                                            else {loserTender.push(loserTenderer._id);cb()}
                                        });
                                    } else {
                                        InviteToken.findOne({type: "project-invite", email: loserTenderer.email, 'element.project': people.project}).remove(cb());
                                    }
                                }, function() {
                                    tender.tenderers = [winner];
                                    User.findById(winner._id, function(err, user) {
                                        var activity = {
                                            user: req.user._id,
                                            createdAt: new Date(),
                                            type: "select-winner",
                                            element: {
                                                name: user.name
                                            }
                                        };
                                        tender.inviterActivities.push(activity);
                                        user.projects.push(people.project);
                                        user.markModified("projects");
                                        user.save(function(err) {
                                            if (err) {return res.send(500,err);}
                                            InviteToken.findOne({type: "project-invite", user: user._id, 'element.project': people.project}).remove(function() {
                                                people._winnerTender = winnerTenderNotification;
                                                people._loserTender = loserTender;
                                                people.markModified('selectWinnerTender');
                                                people._editUser = req.user;
                                                people.save(function(err){
                                                    if (err) {return res.send(500,err);}
                                                    People.populate(people, 
                                                    [populatePaths], function(err, people) {
                                                        return res.json(people);
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            }
                        });
                    } else {
                        return res.send(500, {msg: "You haven\'t got privilege to do this action"});
                    }
                });
            }
        });
    }
};

exports.getInvitePeople = function(req, res) {
    People.findOne({project: req.params.id})
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
    .exec(function(err, people){
        if (err) {return res.send(500,err);}
        if (!people) {return res.send(404);}
        else {
            responseWithEachType(people, req, res);
        }
    });
};

exports.getTender = function(req, res) {
    People.findOne({project: req.params.id})
    .populate("builders.tenderers._id", "_id email name")
    .populate("builders.inviter", "_id email name")
    .populate("builders.inviterActivities.user", "_id email name")
    .populate("subcontractors.tenderers._id", "_id email name")
    .populate("subcontractors.inviter", "_id email name")
    .populate("subcontractors.inviterActivities.user", "_id email name")
    .populate("consultants.tenderers._id", "_id email name")
    .populate("consultants.inviter", "_id email name")
    .populate("consultants.inviterActivities.user", "_id email name")
    .exec(function(err, people){
        if (err) {return res.send(500,err);}
        if (!people) {return res.send(404);}
        else {
            responseTender(people, req, res);
        }
    });
};

function responseTender(people, req, res) {
    var result = [];
    var roles = ["builders", "subcontractors", "consultants"];
    _.each(roles, function(role) {
        var index = _.findIndex(people[role], function(tender) {
            return tender._id == req.params.tenderId;
        });
        if (index != -1) {
            var currentTendererActivities = [];
            var inviterActivities = [];
            _.each(people[role], function(tender) {
                _.each(tender.relatedItem, function(item) {
                    if (_.indexOf(item.members, req.user.email) !== -1 || tender.inviter._id.toString()===req.user._id.toString()) {
                        currentTendererActivities.push(item);
                    }
                });
                _.each(tender.inviterActivities, function(activity) {
                    if (activity.type === "edit-tender" || activity.type === "attach-scope" || activity.type === "attach-addendum" || activity.type === "invite-tender") {
                        inviterActivities.push(activity);
                    } else {
                        if ((activity.element && _.indexOf(activity.element.members, req.user.email) !== -1) || tender.inviter._id.toString()===req.user._id.toString() || activity.user._id.toString()===req.user._id.toString()) {
                            inviterActivities.push(activity);
                        }
                    }
                });
                if (tender._id.toString() == req.params.tenderId && tender.inviter._id.toString() == req.user._id) {
                    result = tender;
                } else {
                    _.each(tender.tenderers, function(tenderer) {
                        if (tenderer._id && tenderer._id._id.toString() == req.user._id) {
                            result = tender;
                            result.relatedItem = currentTendererActivities;
                            result.inviterActivities = inviterActivities;
                            result.tenderers = [];
                            result.tenderers.push(tenderer);
                        }
                    });
                }
            });
            return res.send(200,result);
        }
    });
};

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

function responseWithEachType(people, req, res){
    var roles = ["builders", "clients", "architects", "subcontractors", "consultants"];
    _.each(roles, function(role) {
        _.each(people[role], function(tender) {
            var index = _.findIndex(tender.tenderers, function(tenderer) {
                if (tenderer._id) {
                    return tenderer._id._id.toString() === req.user._id.toString();
                }
            });
            if (index !== -1) {
                if (people.project.projectManager.type === "builder") {
                    switch (role) {
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
                            people[role] = filterCurrentTender(people[role], req.user);
                            return res.send(200, people);
                            break;
                        case 'architects':
                            people.builders.teamMember = [];
                            people.clients = [];
                            people.subcontractors = [];
                            people.consultants = filterConsultants(people.consultants, req.user);
                            people[role] = filterCurrentTender(people[role], req.user);
                            return res.send(200, people);
                            break;
                        
                        default:
                            break;
                    }
                } else if (people.project.projectManager.type === "homeOwner") {
                    switch (role) {
                        case 'builders':
                            people.clients.teamMember = [];
                            people.architects = [];
                            people.subcontractors.teamMember = [];
                            people.consultants = filterConsultants(people.consultants, req.user);
                            people[role] = filterCurrentTender(people[role], req.user);
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
                            people[role] = filterCurrentTender(people[role], req.user);
                            people.consultants = filterConsultants(people.consultants, req.user);
                            people.subcontractors = [];
                            return res.send(200, people);
                            break;
                        
                        default:
                            break;
                    }
                } else if (people.project.projectManager.type === "architect") {
                    switch (role) {
                        case 'builders':
                            people.clients = [];
                            people.architects.teamMember = [];
                            people.subcontractors.teamMember = [];
                            people.consultants.teamMember = [];
                            people.consultants = filterConsultants(people.consultants, req.user);
                            people[role] = filterCurrentTender(people[role], req.user);
                            return res.send(200, people)
                            break;
                        case 'clients':
                            people.builders = [];
                            people.architects.teamMember = [];
                            people.consultants = filterConsultants(people.consultants, req.user);
                            people[role] = filterCurrentTender(people[role], req.user);
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
                if (role === "subcontractors") {
                    people.architects = [];
                    people.consultants = [];
                    people.clients = [];
                    var result = [];
                    var currentInviterTeam = [];
                    var builders = []
                    _.each(people.builders, function(item) {
                        var inviterIndex = _.findIndex(item.tenderers, function(itemTenderer) {
                            if (itemTenderer._id) {
                                return itemTenderer._id._id.toString() === tender.inviter._id.toString();
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
                } else if (role === "consultants") {
                    people.subcontractors = [];
                    var currentTender = tender;
                    currentTender.tenderers = [tender.tenderers[index]];
                    people.consultants = currentTender;
                    var currentInviterTeam = [];
                    var result = [];
                    _.each(people[currentTender.inviterType], function(item) {
                        var inviterIndex = _.findIndex(item.tenderers, function(itemTenderer) {
                            if (itemTenderer._id) {
                                return itemTenderer._id._id.toString() === tender.inviter._id.toString();
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
                _.each(tender.tenderers, function(tenderer) {
                    if (_.findIndex(tenderer.teamMember, function(member) {
                        return member._id.toString() === req.user._id.toString();
                    }) !== -1) {
                        if (roles.indexOf(role) !== -1) {
                            var newRoles = roles;
                            newRoles.splice(roles.indexOf(role),1);
                            _.each(newRoles, function(newRole) {
                                people[newRole] = [];
                            });
                            return res.send(200, people);
                        }
                    }
                });
            }
        });
    });
};

exports.updateDistributeStatus = function(req, res) {
    People.findOne({project: req.params.id})
    .exec(function(err, people) {
        if (err) {return res.send(500,err);}
        else if (!people) {
            return res.send(404, {message: "The specific people is not existed"});
        } else {
            var roles = ["builders","subcontractors", "consultants"];
            var currentRole, index;
            _.each(roles, function(role) {
                index = _.findIndex(people[role], function(tender) {
                    return tender._id.toString()===req.params.tenderId.toString();
                });
                if (index !== -1) {
                    currentRole = role;
                    return false;
                }
            });
            people[currentRole][index].inviterActivities.push({
                user: req.user._id,
                createdAt: new Date(),
                type: "distribute-status",
                element: {}
            });
            people[currentRole][index].isDistribute = !people[currentRole][index].isDistribute;
            people.markModified("updateDistributeStatus");
            people._updatedTender = people[currentRole][index];
            people._editUser = req.user;
            people._newInviteType = currentRole;
            people.save(function(err) {
                if (err) {return res.send(500,err);}
                People.populate(people, [
                    {path: "builders.tenderers._id", select: "_id name email"},
                    {path: "builders.inviter", select: "_id name email"},
                    {path: "builders.inviterActivities.user", select: "_id name email"},
                    {path: "consultants.tenderers._id", select: "_id name email"},
                    {path: "consultants.inviter", select: "_id name email"},
                    {path: "consultants.inviterActivities.user", select: "_id name email"},
                    {path: "subcontractors.tenderers._id", select: "_id name email"},
                    {path: "subcontractors.inviter", select: "_id name email"},
                    {path: "subcontractors.inviterActivities.user", select: "_id name email"}
                ], function(err, people) {
                    if (err) {return res.send(500,err);}
                    responseTender(people, req, res);
                });
            });
        }
    });
};

exports.attachAddendum = function(req, res) {
    var data = req.body;
    People.findOne({project: req.params.id})
    .exec(function(err, people) {
        if (err) {return res.send(500,err);}
        else if (!people) {
            return res.send(404, {message: "The specific people is not existed"});
        } else {
            var roles = ["builders","subcontractors", "consultants"];
            var currentRole, index;
            _.each(roles, function(role) {
                index = _.findIndex(people[role], function(tender) {
                    return tender._id.toString()===req.params.tenderId.toString();
                });
                if (index !== -1) {
                    currentRole = role;
                    return false;
                }
            });
            var activity = {
                user: req.user._id,
                type: "attach-addendum",
                createdAt: new Date(),
                element: {
                    members: [],
                    name: data.name,
                    description: data.description,
                    element: {

                    }
                }
            };
            var addendum = {
                user: req.user._id,
                createdAt: new Date(),
                element: {
                    name: data.name,
                    description: data.description
                }
            };
            if (data.file) {
                activity.element.link = addendum.element.link = data.file.url;
            }
            people[currentRole][index].inviterActivities.push(activity);
            people[currentRole][index].addendums.push(addendum);
            people._updatedTender = people[currentRole][index];
            people._editUser = req.user;
            people.markModified("attach-addendum");
            people.save(function(err) {
                if (err) {return res.send(500,err);}
                People.populate(people, [
                    {path: "builders.tenderers._id", select: "_id name email"},
                    {path: "builders.inviter", select: "_id name email"},
                    {path: "builders.inviterActivities.user", select: "_id name email"},
                    {path: "consultants.tenderers._id", select: "_id name email"},
                    {path: "consultants.inviter", select: "_id name email"},
                    {path: "consultants.inviterActivities.user", select: "_id name email"},
                    {path: "subcontractors.tenderers._id", select: "_id name email"},
                    {path: "subcontractors.inviter", select: "_id name email"},
                    {path: "subcontractors.inviterActivities.user", select: "_id name email"}
                ], function(err, people) {
                    if (err) {return res.send(500,err);}
                    return res.send(200,people[currentRole][index]);    
                });
            });
        }
    });
};

exports.updateTender = function(req, res) {
    var data = req.body;
    var user = req.user;
    People.findOne({project: req.params.id})
    .populate("builders.tenderers._id", "_id email name")
    .populate("builders.inviter", "_id email name")
    .populate("builders.inviterActivities.user", "_id email name")
    .populate("subcontractors.tenderers._id", "_id email name")
    .populate("subcontractors.inviter", "_id email name")
    .populate("subcontractors.inviterActivities.user", "_id email name")
    .populate("consultants.tenderers._id", "_id email name")
    .populate("consultants.inviter", "_id email name")
    .populate("consultants.inviterActivities.user", "_id email name")
    .exec(function(err, people) {
        if (err) {return res.send(500,err);}
        else if (!people) {
            return res.send(404, {message: "The specific people is not existed"});
        } else {
            var roles = ["builders","subcontractors", "consultants"];
            var currentRole, index;
            _.each(roles, function(role) {
                index = _.findIndex(people[role], function(tender) {
                    return tender._id.toString()===req.params.tenderId.toString();
                });
                if (index !== -1) {
                    currentRole = role;
                    return false;
                }
            });

            var originalTender = people[currentRole][index];
            var activity = {
                user: user._id,
                type: data.editType,
                createdAt: new Date(),
                element: {}
            };

            async.parallel([
                function(cb) {
                    if (data.editType === "edit-tender") {
                        activity.element.description = (originalTender.tenderDescription.length !== data.tenderDescription.length) ? originalTender.tenderDescription : null;
                        activity.element.name = (originalTender.tenderName.length !== data.tenderName.length) ? originalTender.tenderName : null;

                        people[currentRole][index].tenderName = data.tenderName;
                        people[currentRole][index].tenderDescription = data.tenderDescription;
                        cb();
                    } else if (data.editType === "invite-tender") {
                        var members = [];
                        var tenderers = people[currentRole][index].tenderers;
                        async.each(data.newMembers, function(member, cb) {
                            User.findOne({email: member.email}, function(err, user) {
                                if (err) {cb(err);}
                                else if (!user) {
                                    members.push({name:member.name, email: member.email});
                                    tenderers.push({
                                        email: member.email,
                                        name: member.name,
                                        teamMember: []
                                    });
                                    var inviteToken = new InviteToken({
                                        type: 'project-invite',
                                        email: member.email,
                                        element: {
                                            project: people.project,
                                            type: currentRole
                                        }
                                    });
                                    inviteToken._editUser = req.user;
                                    inviteToken.save(cb());
                                } else {
                                    members.push({name:user.name, email: user.email});
                                    tenderers.push({
                                        _id: user._id,
                                        name: user.name,
                                        teamMember: []
                                    });
                                    var inviteToken = new InviteToken({
                                        type: 'project-invite',
                                        user: user._id,
                                        element: {
                                            project: people.project,
                                            type: currentRole
                                        }
                                    });
                                    inviteToken._editUser = req.user;
                                    inviteToken.save(cb());
                                }
                            });
                        }, function() {
                            activity.element.members = members;
                            cb();
                        });
                    } else if (data.editType === "broadcast-message") {
                        var members = [];
                        var userMembers = [];
                        var sentTo = [];
                        async.each(data.members, function(member, callback) {
                            User.findOne({email: member.email}, function(err, _user) {
                                if (err) 
                                    callback();
                                else if (!_user) {
                                    members.push(member.email);
                                    sentTo.push(member.name);
                                    callback();
                                } else {
                                    userMembers.push(_user._id);
                                    members.push(_user.email);
                                    sentTo.push(user.name);
                                    callback();
                                }
                            });
                        }, function() {
                            activity.element.members = members;
                            activity.element.userMembers = userMembers;
                            activity.element.sentTo = sentTo;
                            activity.element.message = data.message;
                            cb();
                        });
                    }
                }
            ], function(err, result) {
                people[currentRole][index].inviterActivities.push(activity);
                if (data.editType === "broadcast-message") 
                    people.markModified("broadcast-message");
                else 
                    people.markModified(currentRole);

                people._updatedTender = people[currentRole][index];
                people._editUser = req.user;
                people.save(function(err) {
                    if (err) {return res.send(500,err);}
                    People.populate(people, [
                        {path: "builders.tenderers._id", select: "_id name email"},
                        {path: "builders.inviter", select: "_id name email"},
                        {path: "builders.inviterActivities.user", select: "_id name email"},
                        {path: "consultants.tenderers._id", select: "_id name email"},
                        {path: "consultants.inviter", select: "_id name email"},
                        {path: "consultants.inviterActivities.user", select: "_id name email"},
                        {path: "subcontractors.tenderers._id", select: "_id name email"},
                        {path: "subcontractors.inviter", select: "_id name email"},
                        {path: "subcontractors.inviterActivities.user", select: "_id name email"}
                    ], function(err, people) {
                        if (err) {return res.send(500,err);}
                        if (data.editType === "broadcast-message") {
                            EventBus.emit('socket:emit', {
                                event: 'broadcast:message',
                                room: people[currentRole][index]._id.toString(),
                                data: people[currentRole][index]
                            });
                            return res.send(200,people[currentRole][index]);    
                        }
                        return res.send(200,people[currentRole][index]);    
                    });
                });
            });
        }
    });
};

exports.submitATender = function(req, res) {
    var data = req.body;
    People.findOne({project: req.params.id}, function(err, people) {
        if (err)
            return res.send(500,err);
        else if (!people) 
            return res.send(404);
        else {
            var members = [];
            var index;
            var tenderIndex;
            var currentRole;
            if (data.userType) {
                currentRole = data.userType;
            } else {
                var roles = ["builders","subcontractors", "consultants"];
                _.each(roles, function(role) {
                    _.each(people[role], function(tender) {
                        if (tender._id.toString() === data.tenderId.toString()) {
                            currentRole = role;
                            return;
                        }
                    });
                });
            }
            _.each(people[currentRole], function(tender, key) {
                index = _.findIndex(tender.tenderers, function(tenderer) {
                    if (tenderer._id) {
                        return tenderer._id.toString() === req.user._id.toString();
                    }
                });
                if (index !== -1) {
                    members = [tender.inviter, req.user._id];
                    tenderIndex = key;
                    return false;
                }
            });
            var file = new File({
                project: req.params.id,
                name: data.filename,
                path: data.url,
                key: data.key,
                server: 's3',
                mimeType: data.mimeType,
                size: data.size,
                owner: req.user._id,
                members: members,
                element: {type: "tender-file"}
            });
            file.save(function(err) {
                if (err)
                    return res.send(500,err);
                people[currentRole][tenderIndex].tenderers[index].tenderFile.push({_id: file._id, name: file.name, link: file.path});
                people[currentRole][tenderIndex].inviterActivities.push({
                    user: req.user._id,
                    createdAt: new Date(),
                    type: "tender-file",
                    element: {
                        userMembers: [people[currentRole][tenderIndex].inviter],
                        name: file.name,
                        project: people.project,
                        _id: file._id
                    }
                });
                people._editUser = req.user;
                people.save(function(err) {
                    if (err) {
                        file.remove(function(){
                            return res.send(500,err);
                        });
                    } else {
                        People.populate(people, [
                            {path: "builders.tenderers._id", select: "_id name email"},
                            {path: "builders.inviter", select: "_id name email"},
                            {path: "builders.inviterActivities.user", select: "_id name email"},
                            {path: "consultants.tenderers._id", select: "_id name email"},
                            {path: "consultants.inviter", select: "_id name email"},
                            {path: "consultants.inviterActivities.user", select: "_id name email"},
                            {path: "subcontractors.tenderers._id", select: "_id name email"},
                            {path: "subcontractors.inviter", select: "_id name email"},
                            {path: "subcontractors.inviterActivities.user", select: "_id name email"}
                        ], function(err, people) {
                            if (err) {return res.send(500,err);}
                            return res.send(200,people[currentRole][tenderIndex]);    
                        });
                    }
                });
            });
        }
    });
};

exports.createRelatedItem = function(req, res) {
    var data = req.body;
    console.log(data);
    var relatedItems = [];
    async.parallel({
        people: function(cb) {
            People.findOne({project: req.params.id})
            .populate("builders.tenderers._id", "_id email name")
            .populate("builders.inviter", "_id email name")
            .populate("builders.inviterActivities.user", "_id email name")
            .populate("subcontractors.tenderers._id", "_id email name")
            .populate("subcontractors.inviter", "_id email name")
            .populate("subcontractors.inviterActivities.user", "_id email name")
            .populate("consultants.tenderers._id", "_id email name")
            .populate("consultants.inviter", "_id email name")
            .populate("consultants.inviterActivities.user", "_id email name")
            .exec(cb);
        },
        thread: function(cb) {
            if (data.type === "thread") {
                async.each(data.members, function(member, cb) {
                    var members = [];
                    var notMembers = [];
                    var thread = new Thread({
                        name: req.body.name,
                        project: req.params.id,
                        element: {type: "project-message"},
                        owner: req.user._id
                    });
                    thread.messages.push({
                        text : data.message,
                        user : req.user._id,
                        mentions: [],
                        sendAt: new Date()
                    });
                    User.findOne({email: member.email}, function(err,user) {
                        if (err) {cb(err);}
                        else if (!user) {
                            notMembers.push(member.email);
                            thread.notMembers = notMembers;
                            thread.save(function(err) {
                                if (err) {cb(err);}
                                else {
                                    relatedItems.push({data: thread, type: "thread"});
                                    cb();
                                }
                            });
                        } else {
                            members.push({_id: member._id});
                            thread.members = members;
                            thread.save(function(err) {
                                if (err) {cb(err);}
                                else {
                                    relatedItems.push({data: thread, type: "thread"});
                                    cb();
                                }
                            });
                        }
                    });
                }, cb);
            } else {
                cb(null);
            }
        }
    }, function(err, result) {
        if (err) {console.log(err);return res.send(500,err);}
        var people = result.people;
        var roles = ["builders","subcontractors", "consultants"];
        var currentRole, index;
        _.each(roles, function(role) {
            index = _.findIndex(people[role], function(tender) {
                return tender._id.toString()===req.params.tenderId.toString();
            });
            if (index !== -1) {
                currentRole = role;
                return false;
            }
        });
        var members = [req.user.email];

        _.each(relatedItems, function(data) {
            people[currentRole][index].inviterActivities.push({
                user: req.user._id,
                type: "related-"+data.type,
                createdAt: new Date(),
                element: {
                    members: (data.data.members.length > 0) ? data.data.members : data.data.notMembers,
                    content: (data.data.name) ? data.data.name : data.data.description
                }
            })
            if (data.data.members.length > 0) {
                var members = _.union(members, data.data.members);
            } else if (data.data.notMembers.length > 0) {
                var members = _.union(members, data.data.notMembers);
            }
            people[currentRole][index].relatedItem.push({
                type: data.type,
                item: {
                    _id: data.data._id,
                    name: data.data.name,
                    description: data.data.description,
                    link: (data.data.path) ? data.data.path : null,
                },
                members: members
            });
        });
        people.markModified(currentRole);
        people.save(function(err) {
            if (err) {return res.send(500,err);}
            responseTender(people, req, res);
        });
    });
};