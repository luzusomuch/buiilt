'use strict';

var People = require('./../../models/people.model');
var InviteToken = require('./../../models/inviteToken.model');
var User = require('./../../models/user.model');
var File = require('./../../models/file.model');
var _ = require('lodash');
var async = require('async');

var populatePaths = [
    {path:"builders.tenderers._id", select: "_id email name"},
    {path:"builders.inviter", select: "_id email name"},
    {path:"builders.tenderers.teamMember", select: "_id email name"},
    {path:"architects.tenderers._id", select: "_id email name"},
    {path:"architects.inviter", select: "_id email name"},
    {path:"architects.tenderers.teamMember", select: "_id email name"},
    {path:"clients.tenderers._id", select: "_id email name"},
    {path:"clients.inviter", select: "_id email name"},
    {path:"clients.tenderers.teamMember", select: "_id email name"},
    {path:"subcontractors.tenderers._id", select: "_id email name"},
    {path:"subcontractors.inviter", select: "_id email name"},
    {path:"subcontractors.tenderers.teamMember", select: "_id email name"},
    {path: "consultants.tenderers._id", select: "_id email name"},
    {path:"consultants.inviter", select: "_id email name"},
    {path: "consultants.tenderers.teamMember", select: "_id email name"},
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
                            User.findOne({email: invite.email}, function(err, user) {
                                if (err) {cb(err);}
                                else if (!user) {
                                    team.push({
                                        tenderName: invite.tenderName,
                                        tenderDescription: invite.tenderDescription,
                                        inviter: req.user._id,
                                        tenderers: [{
                                            email: invite.email,
                                            teamMember: []
                                        }],
                                        hasSelect: true,
                                        isDistribute: true,
                                        createAt: new Date(),
                                        inviterType: (type == "consultants") ? invite.inviterType : null
                                    });
                                    newInviteeNotSignUp.push(invite.email);
                                    cb();
                                } else {
                                    team.push({
                                        tenderName: invite.tenderName,
                                        tenderDescription: invite.tenderDescription,
                                        inviter: req.user._id,
                                        tenderers: [{
                                            _id: user._id,
                                            teamMember: []
                                        }],
                                        hasSelect: true,
                                        isDistribute: true,
                                        createAt: new Date(),
                                        inviterType: (type == "consultants") ? invite.inviterType : null
                                    });
                                    newInviteeSignUpAlready.push(user._id);
                                    user.projects.push(people.project);
                                    user.markModified("projects");
                                    user.save(cb());
                                }
                            });
                        } else {
                            if (invite.invitees.length == 0) {
                                return res.send(500);
                            } else {
                                var tenderers = [];
                                async.each(invite.invitees, function(invitee, callback) {
                                    User.findOne({email: invitee.email}, function(err, user) {
                                        if (err) {callback();}
                                        else if (!user) {
                                            tenderers.push({
                                                email: invitee.email,
                                                teamMember: []
                                            });
                                            newInviteeNotSignUp.push(invitee.email);
                                            var inviteToken = new InviteToken({
                                                type: 'project-invite',
                                                email: invitee.email,
                                                element: {
                                                    project: people.project,
                                                    type: type
                                                }
                                            });
                                            inviteToken._editUser = req.user;
                                            inviteToken.save(callback());
                                        } else {
                                            tenderers.push({
                                                _id: user._id,
                                                teamMember: []
                                            });
                                            newInviteeSignUpAlready.push(user._id);
                                            var inviteToken = new InviteToken({
                                                type: 'project-invite',
                                                user: user._id,
                                                element: {
                                                    project: people.project,
                                                    type: type
                                                }
                                            });
                                            inviteToken._editUser = req.user;
                                            inviteToken.save(callback());
                                        }
                                    });
                                }, function() {
                                    team.push({
                                        tenderName: invite.tenderName,
                                        tenderDescription: invite.tenderDescription,
                                        inviter: req.user._id,
                                        tenderers: tenderers,
                                        createAt: new Date(),
                                        inviterType: (type == "consultants") ? invite.inviterType : null
                                    });
                                    cb();
                                });
                            }
                        }
                    }
                ], function(err, result) {
                    if (err) {return res.send(500,err);}
                    else {
                        people[type] = team;
                        people._newInviteeNotSignUp = newInviteeNotSignUp;
                        people._newInviteeSignUpAlready = newInviteeSignUpAlready;
                        people._newInviteType = invite.type;
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
    People.findOne({project: req.params.id}, function(err, people) {
        if (err) {return res.send(500,err);}
        if (!people) {return res.send(404);}
        else {
            var winnerTenderNotification = [];
            var loserTender = [];
            var roles = ["builders", "clients", "architects", "subcontractors", "consultants"];
            _.each(roles, function(role) {
                _.each(people[role], function(tender) {
                    var index = _.findIndex(tender.tenderers, function(tenderer) {
                        if (tenderer._id) {
                            return tenderer._id.toString() == req.body._id._id;
                        }
                    });
                    if (index != -1) {
                        var winner = tender.tenderers[index];
                        tender.hasSelect = true;
                        winnerTenderNotification.push(winner._id);
                        _.remove(tender.tenderers, function(tenderer) {
                            return tenderer._id.toString() == winner._id;
                        });
                        async.each(tender.tenderers, function(loserTenderer, cb) {
                            InviteToken.findOne({type: "project-invite", user: loserTenderer._id, 'element.project': people.project}).remove(function(err) {
                                if (err) {cb();}
                                else {loserTender.push(loserTenderer._id);cb()}
                            });
                        }, function() {
                            tender.tenderers = [winner];
                            User.findById(winner._id, function(err, user) {
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
            });
        }
    });
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
    .populate("builders.inviterActivities.user", "_id email name")
    .populate("builders.tenderers.teamMember", "_id email name")
    .populate("builders.inviter", "_id email name")
    .populate("architects.tenderers._id", "_id email name")
    .populate("architects.tenderers.teamMember", "_id email name")
    .populate("architects.inviter", "_id email name")
    .populate("architects.inviterActivities.user", "_id email name")
    .populate("clients.tenderers._id", "_id email name")
    .populate("clients.tenderers.teamMember", "_id email name")
    .populate("clients.inviter", "_id email name")
    .populate("clients.inviterActivities.user", "_id email name")
    .populate("subcontractors.tenderers._id", "_id email name")
    .populate("subcontractors.tenderers.teamMember", "_id email name")
    .populate("subcontractors.inviter", "_id email name")
    .populate("subcontractors.inviterActivities.user", "_id email name")
    .populate("consultants.tenderers._id", "_id email name")
    .populate("consultants.tenderers.teamMember", "_id email name")
    .populate("consultants.inviter", "_id email name")
    .populate("consultants.inviterActivities.user", "_id email name")
    .populate("project")
    .exec(function(err, people){
        if (err) {return res.send(500,err);}
        if (!people) {return res.send(404);}
        else {
            var result = [];
            var roles = ["builders", "architects", "subcontractors", "consultants"];
            _.each(roles, function(role) {
                var index = _.findIndex(people[role], function(tender) {
                    return tender._id == req.params.tenderId;
                });
                if (index != -1) {
                    _.each(people[role], function(tender) {
                        if (tender._id.toString() == req.params.tenderId && tender.inviter._id.toString() == req.user._id) {
                            result = tender;
                        } else {
                            _.each(tender.tenderers, function(tenderer) {
                                if (tenderer._id && tenderer._id._id.toString() == req.user._id) {
                                    result = tender;
                                    result.tenderers = [];
                                    result.tenderers.push(tenderer);
                                }
                            });
                        }
                    });
                    return res.send(200,result);
                }
            });
        }
    });
};

function responseWithEachType(people, req, res){
    var roles = ["builders", "clients", "architects", "subcontractors", "consultants"];
    if (people.project.projectManager._id.toString() === req.user._id.toString()) {
        if (people.project.projectManager.type === "builder") {
            roles.splice(_.indexOf(roles, "builders"), 1);
            _.each(roles, function(role) {
                _.each(people[role], function(tender) {
                    _.each(tender.tenderers, function(tenderer) {
                        tenderer.teamMember = [];
                    })
                });
            });
            return res.send(200, people);
        } else if (people.project.projectManager.type === "architect") {
            roles.splice(_.indexOf(roles, "architects"), 1);
            _.each(roles, function(role) {
                _.each(people[role], function(tender) {
                    _.each(tender.tenderers, function(tenderer) {
                        tenderer.teamMember = [];
                    })
                });
            });
            people.subcontractors = [];
            return res.send(200, people);
        } else if (people.project.projectManager.type === "homeOwner") {
            roles.splice(_.indexOf(roles, "clients"), 1);
            _.each(roles, function(role) {
                _.each(people[role], function(tender) {
                    _.each(tender.tenderers, function(tenderer) {
                        tenderer.teamMember = [];
                    })
                });
            });
            people.subcontractors = [];
            return res.send(200, people);
        }
    } else {
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
                                people.consultants.teamMember = [];
                                return res.send(200, people)
                                break;
                            case 'clients':
                                people.builders.teamMember = [];
                                people.architects = [];
                                people.subcontractors = [];
                                people.consultants.teamMember = [];
                                return res.send(200, people);
                                break;
                            case 'architects':
                                people.builders.teamMember = [];
                                people.clients = [];
                                people.subcontractors = [];
                                people.consultants.teamMember = [];
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
                                people.consultants.teamMember = [];
                                return res.send(200, people)
                                break;
                            case 'clients':
                                people.builders.teamMember = [];
                                people.architects.teamMember = [];
                                people.consultants.teamMember = [];
                                people.subcontractors = [];
                                return res.send(200, people);
                                break;
                            case 'architects':
                                people.builders = [];
                                people.clients.teamMember = [];
                                people.consultants.teamMember = [];
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
                                return res.send(200, people)
                                break;
                            case 'clients':
                                people.builders = [];
                                people.architects.teamMember = [];
                                people.consultants.teamMember = [];
                                people.subcontractors = [];
                                return res.send(200, people);
                                break;
                            case 'architects':
                                people.builders.teamMember = [];
                                people.clients.teamMember = [];
                                people.consultants.teamMember = [];
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
    }
};

exports.updateDistributeStatus = function(req, res) {
    People.findOne({project: req.params.id}, function(err, people) {
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
            people[currentRole][index].isDistribute = !people[currentRole][index].isDistribute;
            people.save(function(err) {
                if (err) {return res.send(500,err);}
                return res.send(200);
            });
        }
    });
};

exports.attachAddendum = function(req, res) {
    var data = req.body;
    People.findOne({project: req.params.id})
    .populate("builders.tenderers._id", "_id email name")
    .populate("builders.inviter", "_id email name")
    .populate("consultants.tenderers._id", "_id email name")
    .populate("consultants.inviter", "_id email name")
    .populate("subcontractors.tenderers._id", "_id email name")
    .populate("subcontractors.inviter", "_id email name")
    .exec(function(err, people) {
        if (err) {return res.send(500,err);}
        else if (!people) {
            return res.send(404, {message: "The specific people is not existed"});
        } else {
            async.series({
                file: function(cb) {
                    if (req.body.file) {
                        var file = new File({
                            project: req.params.id,
                            name: data.file.filename,
                            description: data.description,
                            path: data.file.url,
                            key: data.file.key,
                            server: 's3',
                            mimeType: data.file.mimeType,
                            size: data.file.size,
                            owner: req.user._id,
                            element: {type: data.file.type}
                        });
                        file.save(function(err) {
                            if (err) {cb(err);}
                            else {cb(null, file);}
                        });
                    } else {
                        cb(null);
                    }
                }
            }, function(err, result) {
                if (err) {return res.send(500,err);}
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
                        content: data.description
                    }
                };
                if (result.file) {
                    var relatedItem = {
                        type: "file",
                        item: {
                            _id: result.file._id,
                            name: result.file.name,
                            description: result.file.description,
                            link: result.file.path,
                        },
                        members: [people[currentRole][index].inviter.email]
                    };
                }
                _.each(data.members, function(member) {
                    activity.element.members.push(member.email);
                    relatedItem.members.push(member.email)
                });
                activity.element.members = _.uniq(activity.element.members);
                people[currentRole][index].inviterActivities.push(activity);
                if (result.file)
                    people[currentRole][index].relatedItem.push(relatedItem);
                people.save(function(err) {
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
    .populate("consultants.tenderers._id", "_id email name")
    .populate("consultants.inviter", "_id email name")
    .populate("subcontractors.tenderers._id", "_id email name")
    .populate("subcontractors.inviter", "_id email name")
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
                type: req.body.editType,
                createdAt: new Date(),
                element: {}
            };
            if (data.editType === "edit-tender") {
                activity.element.description = (originalTender.tenderDescription.length !== data.tenderDescription.length) ? originalTender.tenderDescription : null;
                activity.element.name = (originalTender.tenderName.length !== data.tenderName.length) ? originalTender.tenderName : null;

                people[currentRole][index].tenderName = data.tenderName;
                people[currentRole][index].tenderDescription = data.tenderDescription;
            } else if (data.editType === "invite-tender") {
                var members = [];
                var tenderers = people[currentRole][index].tenderers;
                async.each(data.newMembers, function(member, cb) {
                    members.push({name:member.name, email: member.email});
                    User.findOne({email: member.email}, function(err, user) {
                        if (err) {cb(err);}
                        else if (!user) {
                            tenderers.push({
                                email: member.email,
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
                            tenderers.push({
                                _id: user._id,
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
                });
            }
            people[currentRole][index].inviterActivities.push(activity);
            people.save(function(err) {
                if (err) {return res.send(500,err);}
                return res.send(200,people[currentRole][index]);
            });
        }
    });
};