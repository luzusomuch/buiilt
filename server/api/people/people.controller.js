'use strict';

var People = require('./../../models/people.model');
var InviteToken = require('./../../models/inviteToken.model');
var User = require('./../../models/user.model');
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
                if (invite.teamMember.length == 0) {
                    return res.send(500, "Please check your input");
                }
                var currentTeam = people[invite.inviterType].teamMember;
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
                            if (people.project.projectManager._id.toString() === req.user._id.toString()) {
                                return res.send(200,people);
                            }
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
                                        inviter: req.user._id,
                                        tenderers: [{
                                            email: invitee.email,
                                            teamMember: []
                                        }],
                                        hasSelect: true,
                                        createAt: new Date(),
                                        inviterType: (type == "consultants") ? invite.inviterType : null
                                    });
                                    newInviteeNotSignUp.push(invite.email);
                                    cb();
                                } else {
                                    team.push({
                                        tenderName: invite.tenderName,
                                        inviter: req.user._id,
                                        tenderers: [{
                                            _id: user._id,
                                            teamMember: []
                                        }],
                                        hasSelect: true,
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
                                            inviteToken.save(callback());
                                        }
                                    });
                                }, function() {
                                    team.push({
                                        tenderName: invite.tenderName,
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
    console.log(req.params);
    People.findOne({project: req.params.id}, function(err, people) {
        if (err) {return res.send(500,err);}
        if (!people) {return res.send(404);}
        else {
            console.log(people);
            return;
            var winnerTenderNotification = [];
            var loserTender = [];
            if (req.body.type == 'subcontractor') {
                var winnerTender = _.remove(people.subcontractors, function(item) {
                    return item.inviter == req.body.tender.inviter._id && item._id == req.body.tender._id._id;
                });
                console.log(winnerTender);
                winnerTender[0].hasSelect = true;
                winnerTenderNotification.push(req.body.tender._id._id);
                _.each(people.subcontractors, function(subcontractor) {
                    if (subcontractor.hasSelect) {
                        winnerTender.push(subcontractor);
                    }
                    if (subcontractor._id && !subcontractor.hasSelect) {
                        loserTender.push(subcontractor._id);
                        User.findById(subcontractor._id, function(err, user) {
                            if (err) {return res.send(500,err);}
                            if (!user) {return res.send(404);}
                            var index = user.projects.indexOf(people.project);
                            user.projects.splice(index,1);
                            user.markModified('projects');
                            user.save();
                        });
                    }
                });
                people.subcontractors = winnerTender;
                people._winnerTender = winnerTenderNotification;
                people._loserTender = loserTender;
                people.markModified('selectWinnerTender');
                people._editUser = req.user;
                people.save(function(err){
                    if (err) {return res.send(500,err);}
                    People.populate(people, 
                    [{path:"builders._id", select: "_id email name"},
                    {path:"builders.teamMember", select: "_id email name"},
                    {path:"architects._id", select: "_id email name"},
                    {path:"architects.teamMember", select: "_id email name"},
                    {path:"clients._id", select: "_id email name"},
                    {path:"clients.teamMember", select: "_id email name"},
                    {path:"subcontractors._id", select: "_id email name"},
                    {path:"subcontractors.teamMember", select: "_id email name"},
                    {path: "consultants._id", select: "_id email name"},
                    {path: "consultants.teamMember", select: "_id email name"}
                    ], function(err, people) {
                        return res.json(people);
                    });
                });
            } else if (req.body.type == 'builder') {
                var winnerTender = _.remove(people.builders, function(item) {
                    return item.inviter == req.body.tender.inviter && item._id == req.body.tender._id._id;
                });
                winnerTender[0].hasSelect = true;
                winnerTenderNotification.push(req.body.tender._id._id);
                _.each(people.builders, function(builder) {
                    if (builder._id) {
                        loserTender.push(builder._id);
                        User.findById(builder._id, function(err, user) {
                            if (err) {return res.send(500,err);}
                            if (!user) {return res.send(404);}
                            var index = user.projects.indexOf(people.project);
                            user.projects.splice(index,1);
                            user.markModified('projects');
                            user.save();
                        });
                    }
                });
                people.builders = winnerTender;
                people._winnerTender = winnerTenderNotification;
                people._loserTender = loserTender;
                people.markModified('selectWinnerTender');
                people._editUser = req.user;
                people.save(function(err){
                    if (err) {return res.send(500,err);}
                    People.populate(people, 
                    [{path:"builders._id", select: "_id email name"},
                    {path:"builders.teamMember", select: "_id email name"},
                    {path:"architects._id", select: "_id email name"},
                    {path:"architects.teamMember", select: "_id email name"},
                    {path:"clients._id", select: "_id email name"},
                    {path:"clients.teamMember", select: "_id email name"},
                    {path:"subcontractors._id", select: "_id email name"},
                    {path:"subcontractors.teamMember", select: "_id email name"},
                    {path: "consultants._id", select: "_id email name"},
                    {path: "consultants.teamMember", select: "_id email name"}
                    ], function(err, people) {
                        return res.json(people);
                    });
                });
            } else if (req.body.type == 'consultant') {
                var winnerTender = _.remove(people.consultants, function(item) {
                    return item.inviter == req.body.tender.inviter._id && item._id == req.body.tender._id._id;
                });
                winnerTender[0].hasSelect = true;
                winnerTenderNotification.push(req.body.tender._id._id);
                _.each(people.consultants, function(consultant) {
                    if (consultant.hasSelect) {
                        winnerTender.push(consultant);
                    }
                    if (consultant._id && !consultant.hasSelect) {
                        loserTender.push(consultant._id);
                        User.findById(consultant._id, function(err, user) {
                            if (err) {return res.send(500,err);}
                            if (!user) {return res.send(404);}
                            var index = user.projects.indexOf(people.project);
                            user.projects.splice(index,1);
                            user.markModified('projects');
                            user.save();
                        });
                    }
                });
                people.consultants = winnerTender;
                people._winnerTender = winnerTenderNotification;
                people._loserTender = loserTender;
                people.markModified('selectWinnerTender');
                people._editUser = req.user;
                people.save(function(err){
                    if (err) {return res.send(500,err);}
                    People.populate(people, 
                    [{path:"builders._id", select: "_id email name"},
                    {path:"builders.teamMember", select: "_id email name"},
                    {path:"architects._id", select: "_id email name"},
                    {path:"architects.teamMember", select: "_id email name"},
                    {path:"clients._id", select: "_id email name"},
                    {path:"clients.teamMember", select: "_id email name"},
                    {path:"subcontractors._id", select: "_id email name"},
                    {path:"subcontractors.teamMember", select: "_id email name"},
                    {path: "consultants._id", select: "_id email name"},
                    {path: "consultants.teamMember", select: "_id email name"}
                    ], function(err, people) {
                        return res.json(people);
                    });
                });
            } else if (req.body.type == 'client') {
                var winnerTender = _.remove(people.clients, function(item) {
                    return item.inviter == req.body.tender.inviter._id && item._id == req.body.tender._id._id;
                });
                winnerTender[0].hasSelect = true;
                winnerTenderNotification.push(req.body.tender._id._id);
                _.each(people.clients, function(client) {
                    if (client._id) {
                        loserTender.push(client._id);
                        User.findById(client._id, function(err, user) {
                            if (err) {return res.send(500,err);}
                            if (!user) {return res.send(404);}
                            var index = user.projects.indexOf(people.project);
                            user.projects.splice(index,1);
                            user.markModified('projects');
                            user.save();
                        });
                    }
                });
                people.clients = winnerTender;
                people._winnerTender = winnerTenderNotification;
                people._loserTender = loserTender;
                people.markModified('selectWinnerTender');
                people._editUser = req.user;
                people.save(function(err){
                    if (err) {return res.send(500,err);}
                    People.populate(people, 
                    [{path:"builders._id", select: "_id email name"},
                    {path:"builders.teamMember", select: "_id email name"},
                    {path:"architects._id", select: "_id email name"},
                    {path:"architects.teamMember", select: "_id email name"},
                    {path:"clients._id", select: "_id email name"},
                    {path:"clients.teamMember", select: "_id email name"},
                    {path:"subcontractors._id", select: "_id email name"},
                    {path:"subcontractors.teamMember", select: "_id email name"},
                    {path: "consultants._id", select: "_id email name"},
                    {path: "consultants.teamMember", select: "_id email name"}
                    ], function(err, people) {
                        return res.json(people);
                    });
                });
            } else if (req.body.type == 'architect') {
                var winnerTender = _.remove(people.architects, function(item) {
                    return item.inviter == req.body.tender.inviter && item._id == req.body.tender._id._id;
                });
                winnerTender[0].hasSelect = true;
                winnerTenderNotification.push(req.body.tender._id._id);
                _.each(people.architects, function(architect) {
                    if (architect._id) {
                        loserTender.push(architect._id);
                        User.findById(architect._id, function(err, user) {
                            if (err) {return res.send(500,err);}
                            if (!user) {return res.send(404);}
                            var index = user.projects.indexOf(people.project);
                            user.projects.splice(index,1);
                            user.markModified('projects');
                            user.save();
                        });
                    }
                });
                people.architects = winnerTender;
                people._winnerTender = winnerTenderNotification;
                people._loserTender = loserTender;
                people.markModified('selectWinnerTender');
                people._editUser = req.user;
                people.save(function(err){
                    if (err) {return res.send(500,err);}
                    People.populate(people, 
                    [{path:"builders._id", select: "_id email name"},
                    {path:"builders.teamMember", select: "_id email name"},
                    {path:"architects._id", select: "_id email name"},
                    {path:"architects.teamMember", select: "_id email name"},
                    {path:"clients._id", select: "_id email name"},
                    {path:"clients.teamMember", select: "_id email name"},
                    {path:"subcontractors._id", select: "_id email name"},
                    {path:"subcontractors.teamMember", select: "_id email name"},
                    {path: "consultants._id", select: "_id email name"},
                    {path: "consultants.teamMember", select: "_id email name"}
                    ], function(err, people) {
                        return res.json(people);
                    });
                });
            } else {
                return res.send(500);
            }
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
            if (people.project.projectManager._id.toString() === req.user._id.toString()) {
                return res.send(200, people);
            } else {
                responseWithEachType(people, req, res);
            }
        }
    });
};

exports.getTender = function(req, res) {
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
            var result = [];
            var roles = ["builders", "clients", "architects", "subcontractors", "consultants"];
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
                                if (tenderer._id._id.toString() == req.user._id) {
                                    result = tender;
                                    result.tenderers = [];
                                    result.tenderers.push(tenderer);
                                }
                            });
                        }
                    });
                    console.log(result);
                    return res.send(200,result);
                }
            });
        }
    });
};

function responseWithEachType(people, req, res){
    var roles = ["builders", "clients", "architects", "subcontractors", "consultants"];
    _.each(roles, function(role) {
        _.each(people[role], function(tender) {
            var index = _.findIndex(tender.tenderers, function(tender) {
                if (tender._id) {
                    return tender._id._id.toString() === req.user._id.toString();
                } else {
                    _.each(tender.teamMember, function(member) {
                        return member._id.toString() == req.user._id;
                    });
                }
            });

            if (index != -1) {
                switch (role) {
                    case 'builders':
                        break;
                    case 'clients':
                        people.builders.teamMember = [];
                        people.architects.teamMember = [];
                        people.subcontractors.teamMember = [];
                        people.consultants.teamMember = [];
                        people.subcontractors = [];
                        return res.send(200, people);
                        break;
                    case 'subcontractors':
                        people.builders = [];
                        people.architects = [];
                        people.consultants = [];
                        people.clients = [];
                        var result = [];
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
                        return res.send(200, people);
                        break;
                    default:
                        break;
                }
            }
        });
    });
};