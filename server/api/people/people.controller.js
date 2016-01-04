'use strict';

var People = require('./../../models/people.model');
var InviteToken = require('./../../models/inviteToken.model');
var User = require('./../../models/user.model');
var _ = require('lodash');
var async = require('async');

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
                        {path: "consultants.teamMember", select: "_id email name"},
                        {path: "project"}
                        ], function(err, people) {
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
                                        inviter: req.user._id,
                                        email: invite.email,
                                        hasSelect: true,
                                        inviterType: (type == "consultants") ? invite.inviterType : null
                                    });
                                    newInviteeNotSignUp.push(invite.email);
                                    cb();
                                } else {
                                    team.push({
                                        inviter: req.user._id,
                                        _id: user._id,
                                        hasSelect: true,
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
                                async.each(invite.invitees, function(invitee, callback) {
                                    User.findOne({email: invitee.email}, function(err, user) {
                                        if (err) {callback();}
                                        else if (!user) {
                                            team.push({
                                                inviter: req.user._id,
                                                email: invitee.email,
                                                inviterType: (type == "consultants") ? invite.inviterType : null
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
                                            team.push({
                                                inviter: req.user._id,
                                                _id: user._id,
                                                inviterType: (type == "consultants") ? invite.inviterType : null
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
                            {path: "consultants.teamMember", select: "_id email name"},
                            {path: "projectManager.teamMember", select: "_id email name"},
                            {path: "project"}
                            ], function(err, people) {
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
    // return;
    // People.findOne({project:req.params.id}, function(err, people){
    //     if (err) {return res.send(500,err);}
    //     if (!people) {return res.send(404,err);}
    //     else {
    //         var newInviteeNotSignUp = [];
    //         var newInviteeSignUpAlready = [];
    //         if (invite.type == 'addBuilder') {
    //             if (invite.isTender) {
    //                 var builders = people.builders;
    //                 async.each(invite.invitees, function(invitee, cb) {
    //                     User.findOne({email: invitee.email}, function(err, builder) {
    //                         if (err) {return cb(err);}
    //                         if (!builder) {
    //                             builders.push({
    //                                 inviter: req.user._id,
    //                                 email: invitee.email
    //                             });
    //                             newInviteeNotSignUp.push(invitee.email);
    //                             cb();
    //                         } else {
    //                             builders.push({
    //                                 inviter: req.user._id,
    //                                 _id: builder._id
    //                             });
    //                             newInviteeSignUpAlready.push(builder._id);
    //                             builder.projects.push(people.project);
    //                             builder.markModified('projects');
    //                             builder.save(cb());
    //                         }
    //                     })
    //                 }, function(err) {
    //                     if (err) {return res.send(500,err);}
    //                     people.builders = builders;
    //                     people._newInviteeNotSignUp = newInviteeNotSignUp;
    //                     people._newInviteeSignUpAlready = newInviteeSignUpAlready;
    //                     people._newInviteType = 'peopleBuilder';
    //                     people.markModified('invitePeople');
    //                     people._editUser = req.user;
    //                     people.save(function(err){
    //                         if (err) {return res.send(500,err);}
    //                         People.populate(people, 
    //                         [{path:"builders._id", select: "_id email name"},
    //                         {path:"builders.teamMember", select: "_id email name"},
    //                         {path:"architects._id", select: "_id email name"},
    //                         {path:"architects.teamMember", select: "_id email name"},
    //                         {path:"clients._id", select: "_id email name"},
    //                         {path:"clients.teamMember", select: "_id email name"},
    //                         {path:"subcontractors._id", select: "_id email name"},
    //                         {path:"subcontractors.teamMember", select: "_id email name"},
    //                         {path: "consultants._id", select: "_id email name"},
    //                         {path: "consultants.teamMember", select: "_id email name"}
    //                         ], function(err, people) {
    //                             return res.json(people);
    //                         });
    //                     });
    //                 });
    //             } else {
    //                 if (invite.isInviteTeamMember) {
    //                     var builders = people.builders;
    //                     _.each(builders, function(builder){
    //                         if (builder._id) {
    //                             if (builder._id.toString() == req.user._id.toString()) {
    //                                 async.each(invite.teamMember, function(member, cb) {
    //                                     User.findById(member._id, function(err, user) {
    //                                         if (err || !user) {return cb(err);}
    //                                         else {
    //                                             newInviteeSignUpAlready.push(user._id);
    //                                             builder.teamMember.push(user._id);
    //                                             user.projects.push(people.project);
    //                                             user.markModified('projects');
    //                                             user.save(cb());
    //                                         }
    //                                     });
    //                                 }, function(){
    //                                     people.builders = builders;
    //                                     people._newInviteeNotSignUp = newInviteeNotSignUp;
    //                                     people._newInviteeSignUpAlready = newInviteeSignUpAlready;
    //                                     people._newInviteType = 'peopleSubcontractor';
    //                                     people.markModified('invitePeople');
    //                                     people._editUser = req.user;
    //                                     people.save(function(err){
    //                                         if (err) {return res.send(500,err);}
    //                                         People.populate(people, 
    //                                         [{path:"builders._id", select: "_id email name"},
    //                                         {path:"builders.teamMember", select: "_id email name"},
    //                                         {path:"architects._id", select: "_id email name"},
    //                                         {path:"architects.teamMember", select: "_id email name"},
    //                                         {path:"clients._id", select: "_id email name"},
    //                                         {path:"clients.teamMember", select: "_id email name"},
    //                                         {path:"subcontractors._id", select: "_id email name"},
    //                                         {path:"subcontractors.teamMember", select: "_id email name"},
    //                                         {path: "consultants._id", select: "_id email name"},
    //                                         {path: "consultants.teamMember", select: "_id email name"}
    //                                         ], function(err, people) {
    //                                             return res.json(people);
    //                                         });
    //                                     });
    //                                 });
    //                             } 
    //                         }
    //                     });
    //                 } else {
    //                     var builders = [];
    //                     User.findOne({email: invite.email}, function(err, builder) {
    //                         if (err) {return res.send(500,err);}
    //                         if (!builder) {
    //                             builders.push({
    //                                 inviter: req.user._id,
    //                                 email: invite.email,
    //                                 hasSelect: true
    //                             });
    //                             newInviteeNotSignUp.push(invite.email);
    //                         } else {
    //                             builders.push({
    //                                 inviter: req.user._id,
    //                                 _id: builder._id,
    //                                 hasSelect: true
    //                             });
    //                             newInviteeSignUpAlready.push(builder._id);
    //                             builder.projects.push(people.project);
    //                             builder.markModified('projects');
    //                             builder.save();
    //                         }
    //                     });
    //                     setTimeout(function() {
    //                         people.builders = builders;
    //                         people._newInviteeNotSignUp = newInviteeNotSignUp;
    //                         people._newInviteeSignUpAlready = newInviteeSignUpAlready;
    //                         people._newInviteType = 'peopleBuilder';
    //                         people.markModified('invitePeople');
    //                         people._editUser = req.user;
    //                         people.save(function(err){
    //                             if (err) {return res.send(500,err);}
    //                             People.populate(people, 
    //                             [{path:"builders._id", select: "_id email name"},
    //                             {path:"builders.teamMember", select: "_id email name"},
    //                             {path:"architects._id", select: "_id email name"},
    //                             {path:"architects.teamMember", select: "_id email name"},
    //                             {path:"clients._id", select: "_id email name"},
    //                             {path:"clients.teamMember", select: "_id email name"},
    //                             {path:"subcontractors._id", select: "_id email name"},
    //                             {path:"subcontractors.teamMember", select: "_id email name"},
    //                             {path: "consultants._id", select: "_id email name"},
    //                             {path: "consultants.teamMember", select: "_id email name"}
    //                             ], function(err, people) {
    //                                 return res.json(people);
    //                             });
    //                         });
    //                     }, 2000);
    //                 }
    //             }
    //         } else if (invite.type == 'addArchitect') {
    //             if (invite.isTender) {
    //                 var architects = people.architects;
    //                 async.each(invite.invitees, function(invitee, cb) {
    //                     User.findOne({email: invitee.email}, function(err, architect) {
    //                         if (err) {return cb(err);}
    //                         if (!architect) {
    //                             architects.push({
    //                                 inviter: req.user._id,
    //                                 email: invitee.email
    //                             });
    //                             newInviteeNotSignUp.push(invitee.email);
    //                             cb();
    //                         } else {
    //                             architects.push({
    //                                 inviter: req.user._id,
    //                                 _id: architect._id
    //                             });
    //                             newInviteeSignUpAlready.push(architect._id);
    //                             architect.projects.push(people.project);
    //                             architect.markModified('projects');
    //                             architect.save(cb());
    //                         }
    //                     })
    //                 }, function(err) {
    //                     if (err) {return res.send(500,err);}
    //                     people.architects = architects;
    //                     people._newInviteeNotSignUp = newInviteeNotSignUp;
    //                     people._newInviteeSignUpAlready = newInviteeSignUpAlready;
    //                     people._newInviteType = 'peopleArchitect';
    //                     people.markModified('invitePeople');
    //                     people._editUser = req.user;
    //                     people.save(function(err){
    //                         if (err) {return res.send(500,err);}
    //                         People.populate(people, 
    //                         [{path:"builders._id", select: "_id email name"},
    //                         {path:"builders.teamMember", select: "_id email name"},
    //                         {path:"architects._id", select: "_id email name"},
    //                         {path:"architects.teamMember", select: "_id email name"},
    //                         {path:"clients._id", select: "_id email name"},
    //                         {path:"clients.teamMember", select: "_id email name"},
    //                         {path:"subcontractors._id", select: "_id email name"},
    //                         {path:"subcontractors.teamMember", select: "_id email name"},
    //                         {path: "consultants._id", select: "_id email name"},
    //                         {path: "consultants.teamMember", select: "_id email name"}
    //                         ], function(err, people) {
    //                             return res.json(people);
    //                         });
    //                     });
    //                 });
    //             } else {
    //                 if (invite.isInviteTeamMember) {
    //                     var architects = people.architects;
    //                     _.each(architects, function(architect){
    //                         if (architect._id) {
    //                             if (architect._id.toString() == req.user._id.toString()) {
    //                                 async.each(invite.teamMember, function(member, cb) {
    //                                     User.findById(member._id, function(err, user) {
    //                                         if (err || !user) {return cb(err);}
    //                                         else {
    //                                             newInviteeSignUpAlready.push(user._id);
    //                                             architect.teamMember.push(user._id);
    //                                             user.projects.push(people.project);
    //                                             user.markModified('projects');
    //                                             user.save(cb());
    //                                         }
    //                                     });
    //                                 }, function(){
    //                                     people.architects = architects;
    //                                     people._newInviteeNotSignUp = newInviteeNotSignUp;
    //                                     people._newInviteeSignUpAlready = newInviteeSignUpAlready;
    //                                     people._newInviteType = 'peopleSubcontractor';
    //                                     people.markModified('invitePeople');
    //                                     people._editUser = req.user;
    //                                     people.save(function(err){
    //                                         if (err) {return res.send(500,err);}
    //                                         People.populate(people, 
    //                                         [{path:"builders._id", select: "_id email name"},
    //                                         {path:"builders.teamMember", select: "_id email name"},
    //                                         {path:"architects._id", select: "_id email name"},
    //                                         {path:"architects.teamMember", select: "_id email name"},
    //                                         {path:"clients._id", select: "_id email name"},
    //                                         {path:"clients.teamMember", select: "_id email name"},
    //                                         {path:"subcontractors._id", select: "_id email name"},
    //                                         {path:"subcontractors.teamMember", select: "_id email name"},
    //                                         {path: "consultants._id", select: "_id email name"},
    //                                         {path: "consultants.teamMember", select: "_id email name"}
    //                                         ], function(err, people) {
    //                                             return res.json(people);
    //                                         });
    //                                     });
    //                                 });
    //                             } 
    //                         }
    //                     });
    //                 } else {
    //                     var architects = [];
    //                     User.findOne({email: invite.email}, function(err, architect) {
    //                         if (err) {return res.send(500,err);}
    //                         if (!architect) {
    //                             architects.push({
    //                                 inviter: req.user._id,
    //                                 email: invite.email,
    //                                 hasSelect: true
    //                             });
    //                             newInviteeNotSignUp.push(invite.email);
    //                         } else {
    //                             architects.push({
    //                                 inviter: req.user._id,
    //                                 _id: architect._id,
    //                                 hasSelect: true
    //                             });
    //                             newInviteeSignUpAlready.push(architect._id);
    //                             architect.projects.push(people.project);
    //                             architect.markModified('projects');
    //                             architect.save();
    //                         }
    //                     });
    //                     setTimeout(function() {
    //                         people.architects = architects;
    //                         people._newInviteeNotSignUp = newInviteeNotSignUp;
    //                         people._newInviteeSignUpAlready = newInviteeSignUpAlready;
    //                         people._newInviteType = 'peopleArchitect';
    //                         people.markModified('invitePeople');
    //                         people._editUser = req.user;
    //                         people.save(function(err){
    //                             if (err) {return res.send(500,err);}
    //                             People.populate(people, 
    //                             [{path:"builders._id", select: "_id email name"},
    //                             {path:"builders.teamMember", select: "_id email name"},
    //                             {path:"architects._id", select: "_id email name"},
    //                             {path:"architects.teamMember", select: "_id email name"},
    //                             {path:"clients._id", select: "_id email name"},
    //                             {path:"clients.teamMember", select: "_id email name"},
    //                             {path:"subcontractors._id", select: "_id email name"},
    //                             {path:"subcontractors.teamMember", select: "_id email name"},
    //                             {path: "consultants._id", select: "_id email name"},
    //                             {path: "consultants.teamMember", select: "_id email name"}
    //                             ], function(err, people) {
    //                                 return res.json(people);
    //                             });
    //                         });
    //                     }, 2000);
    //                 }
    //             }
    //         } else if (invite.type == 'addClient') {
    //             if (invite.isTender) {
    //                 var clients = people.clients;
    //                 async.each(invite.invitees, function(invitee, cb) {
    //                     User.findOne({email: invitee.email}, function(err, client) {
    //                         if (err) {return cb(err);}
    //                         if (!client) {
    //                             clients.push({
    //                                 inviter: req.user._id,
    //                                 email: invitee.email
    //                             });
    //                             newInviteeNotSignUp.push(invitee.email);
    //                             cb();
    //                         } else {
    //                             clients.push({
    //                                 inviter: req.user._id,
    //                                 _id: client._id
    //                             });
    //                             newInviteeSignUpAlready.push(client._id);
    //                             client.projects.push(people.project);
    //                             client.markModified('projects');
    //                             client.save(cb());
    //                         }
    //                     })
    //                 }, function(err) {
    //                     if (err) {return res.send(500,err);}
    //                     people.clients = clients;
    //                     people._newInviteeNotSignUp = newInviteeNotSignUp;
    //                     people._newInviteeSignUpAlready = newInviteeSignUpAlready;
    //                     people._newInviteType = 'peopleClient';
    //                     people.markModified('invitePeople');
    //                     people._editUser = req.user;
    //                     people.save(function(err){
    //                         if (err) {return res.send(500,err);}
    //                         People.populate(people, 
    //                         [{path:"builders._id", select: "_id email name"},
    //                         {path:"builders.teamMember", select: "_id email name"},
    //                         {path:"architects._id", select: "_id email name"},
    //                         {path:"architects.teamMember", select: "_id email name"},
    //                         {path:"clients._id", select: "_id email name"},
    //                         {path:"clients.teamMember", select: "_id email name"},
    //                         {path:"subcontractors._id", select: "_id email name"},
    //                         {path:"subcontractors.teamMember", select: "_id email name"},
    //                         {path: "consultants._id", select: "_id email name"},
    //                         {path: "consultants.teamMember", select: "_id email name"}
    //                         ], function(err, people) {
    //                             return res.json(people);
    //                         });
    //                     });
    //                 });
    //             } else {
    //                 if (invite.isInviteTeamMember) {
    //                     var clients = people.clients;
    //                     _.each(clients, function(client){
    //                         if (client._id) {
    //                             if (client._id.toString() == req.user._id.toString()) {
    //                                 async.each(invite.teamMember, function(member, cb) {
    //                                     User.findById(member._id, function(err, user) {
    //                                         if (err || !user) {return cb(err);}
    //                                         else {
    //                                             newInviteeSignUpAlready.push(user._id);
    //                                             client.teamMember.push(user._id);
    //                                             user.projects.push(people.project);
    //                                             user.markModified('projects');
    //                                             user.save(cb());
    //                                         }
    //                                     });
    //                                 }, function(){
    //                                     people.clients = clients;
    //                                     people._newInviteeNotSignUp = newInviteeNotSignUp;
    //                                     people._newInviteeSignUpAlready = newInviteeSignUpAlready;
    //                                     people._newInviteType = 'peopleSubcontractor';
    //                                     people.markModified('invitePeople');
    //                                     people._editUser = req.user;
    //                                     people.save(function(err){
    //                                         if (err) {return res.send(500,err);}
    //                                         People.populate(people, 
    //                                         [{path:"builders._id", select: "_id email name"},
    //                                         {path:"builders.teamMember", select: "_id email name"},
    //                                         {path:"architects._id", select: "_id email name"},
    //                                         {path:"architects.teamMember", select: "_id email name"},
    //                                         {path:"clients._id", select: "_id email name"},
    //                                         {path:"clients.teamMember", select: "_id email name"},
    //                                         {path:"subcontractors._id", select: "_id email name"},
    //                                         {path:"subcontractors.teamMember", select: "_id email name"},
    //                                         {path: "consultants._id", select: "_id email name"},
    //                                         {path: "consultants.teamMember", select: "_id email name"}
    //                                         ], function(err, people) {
    //                                             return res.json(people);
    //                                         });
    //                                     });
    //                                 });
    //                             } 
    //                         }
    //                     });
    //                 } else {
    //                     var clients = [];
    //                     User.findOne({email: invite.email}, function(err, client) {
    //                         if (err) {return res.send(500,err);}
    //                         if (!client) {
    //                             clients.push({
    //                                 inviter: req.user._id,
    //                                 email: invite.email,
    //                                 hasSelect: true
    //                             });
    //                             newInviteeNotSignUp.push(invite.email);
    //                         } else {
    //                             clients.push({
    //                                 inviter: req.user._id,
    //                                 _id: client._id,
    //                                 hasSelect: true
    //                             });
    //                             newInviteeSignUpAlready.push(client._id);
    //                             client.projects.push(people.project);
    //                             client.markModified('projects');
    //                             client.save();
    //                         }
    //                     });
    //                     setTimeout(function() {
    //                         people.clients = clients;
    //                         people._newInviteeNotSignUp = newInviteeNotSignUp;
    //                         people._newInviteeSignUpAlready = newInviteeSignUpAlready;
    //                         people._newInviteType = 'peopleClient';
    //                         people.markModified('invitePeople');
    //                         people._editUser = req.user;
    //                         people.save(function(err){
    //                             if (err) {return res.send(500,err);}
    //                             People.populate(people, 
    //                             [{path:"builders._id", select: "_id email name"},
    //                             {path:"builders.teamMember", select: "_id email name"},
    //                             {path:"architects._id", select: "_id email name"},
    //                             {path:"architects.teamMember", select: "_id email name"},
    //                             {path:"clients._id", select: "_id email name"},
    //                             {path:"clients.teamMember", select: "_id email name"},
    //                             {path:"subcontractors._id", select: "_id email name"},
    //                             {path:"subcontractors.teamMember", select: "_id email name"},
    //                             {path: "consultants._id", select: "_id email name"},
    //                             {path: "consultants.teamMember", select: "_id email name"}
    //                             ], function(err, people) {
    //                                 return res.json(people);
    //                             });
    //                         });
    //                     }, 2000);
    //                 }
    //             }
    //         } else if (invite.type == 'addSubcontractor') {
    //             if (invite.isTender) {
    //                 var subcontractors = people.subcontractors;
    //                 async.each(invite.invitees, function(invitee, cb) {
    //                     User.findOne({email: invitee.email}, function(err, subcontractor) {
    //                         if (err) {return cb(err);}
    //                         if (!subcontractor) {
    //                             subcontractors.push({
    //                                 inviter: req.user._id,
    //                                 email: invitee.email
    //                             });
    //                             newInviteeNotSignUp.push(invitee.email);
    //                             cb();
    //                         } else {
    //                             subcontractors.push({
    //                                 inviter: req.user._id,
    //                                 _id: subcontractor._id
    //                             });
    //                             newInviteeSignUpAlready.push(subcontractor._id);
    //                             subcontractor.projects.push(people.project);
    //                             subcontractor.markModified('projects');
    //                             subcontractor.save(cb());
    //                         }
    //                     })
    //                 }, function(err) {
    //                     if (err) {return res.send(500,err);}
    //                     people.subcontractors = subcontractors;
    //                     people._newInviteeNotSignUp = newInviteeNotSignUp;
    //                     people._newInviteeSignUpAlready = newInviteeSignUpAlready;
    //                     people._newInviteType = 'peopleSubcontractor';
    //                     people.markModified('invitePeople');
    //                     people._editUser = req.user;
    //                     people.save(function(err){
    //                         if (err) {return res.send(500,err);}
    //                         People.populate(people, 
    //                         [{path:"builders._id", select: "_id email name"},
    //                         {path:"builders.teamMember", select: "_id email name"},
    //                         {path:"architects._id", select: "_id email name"},
    //                         {path:"architects.teamMember", select: "_id email name"},
    //                         {path:"clients._id", select: "_id email name"},
    //                         {path:"clients.teamMember", select: "_id email name"},
    //                         {path:"subcontractors._id", select: "_id email name"},
    //                         {path:"subcontractors.teamMember", select: "_id email name"},
    //                         {path: "consultants._id", select: "_id email name"},
    //                         {path: "consultants.teamMember", select: "_id email name"}
    //                         ], function(err, people) {
    //                             return res.json(people);
    //                         });
    //                     });
    //                 });
    //             } else {
    //                 var subcontractors = people.subcontractors;
    //                 if (invite.isInviteTeamMember) {
    //                     _.each(subcontractors, function(subcontractor){
    //                         if (subcontractor._id) {
    //                             if (subcontractor._id.toString() == req.user._id.toString()) {
    //                                 async.each(invite.teamMember, function(member, cb) {
    //                                     User.findById(member._id, function(err, user) {
    //                                         if (err || !user) {return cb(err);}
    //                                         else {
    //                                             newInviteeSignUpAlready.push(user._id);
    //                                             subcontractor.teamMember.push(user._id);
    //                                             user.projects.push(people.project);
    //                                             user.markModified('projects');
    //                                             user.save(cb());
    //                                         }
    //                                     });
    //                                 }, function(){
    //                                     people.subcontractors = subcontractors;
    //                                     people._newInviteeNotSignUp = newInviteeNotSignUp;
    //                                     people._newInviteeSignUpAlready = newInviteeSignUpAlready;
    //                                     people._newInviteType = 'peopleSubcontractor';
    //                                     people.markModified('invitePeople');
    //                                     people._editUser = req.user;
    //                                     people.save(function(err){
    //                                         if (err) {return res.send(500,err);}
    //                                         People.populate(people, 
    //                                         [{path:"builders._id", select: "_id email name"},
    //                                         {path:"builders.teamMember", select: "_id email name"},
    //                                         {path:"architects._id", select: "_id email name"},
    //                                         {path:"architects.teamMember", select: "_id email name"},
    //                                         {path:"clients._id", select: "_id email name"},
    //                                         {path:"clients.teamMember", select: "_id email name"},
    //                                         {path:"subcontractors._id", select: "_id email name"},
    //                                         {path:"subcontractors.teamMember", select: "_id email name"},
    //                                         {path:"subcontractors.inviter", select: "_id email name"},
    //                                         {path: "consultants._id", select: "_id email name"},
    //                                         {path: "consultants.teamMember", select: "_id email name"}
    //                                         ], function(err, people) {
    //                                             return res.json(people);
    //                                         });
    //                                     });
    //                                 });
    //                             } 
    //                         }
    //                     });
    //                 } else {
    //                     User.findOne({email: invite.email}, function(err, subcontractor) {
    //                         if (err) {return res.send(500,err);}
    //                         if (!subcontractor) {
    //                             subcontractors.push({
    //                                 inviter: req.user._id,
    //                                 email: invite.email,
    //                                 hasSelect: true
    //                             });
    //                             newInviteeNotSignUp.push(invite.email);
    //                         } else {
    //                             subcontractors.push({
    //                                 inviter: req.user._id,
    //                                 _id: subcontractor._id,
    //                                 hasSelect: true
    //                             });
    //                             newInviteeSignUpAlready.push(subcontractor._id);
    //                             subcontractor.projects.push(people.project);
    //                             subcontractor.markModified('projects');
    //                             subcontractor.save();
    //                         }
    //                     });
    //                     setTimeout(function() {
    //                         _.each(subcontractors, function(item) {
    //                             if (item.inviter == req.user._id && !item.hasSelect) {
    //                                 if (item._id) {
    //                                     User.findById(item._id, function(err, user) {
    //                                         if (err) {return res.send(500,err);}
    //                                         if (!user) {return res.send(404);}
    //                                         var index = user.projects.indexOf(people.project);
    //                                         user.projects.splice(index,1);
    //                                         user.markModified('projects');
    //                                         user.save();
    //                                     });
    //                                 }
    //                             }
    //                         });
    //                         people.subcontractors = subcontractors;
    //                         people._newInviteeNotSignUp = newInviteeNotSignUp;
    //                         people._newInviteeSignUpAlready = newInviteeSignUpAlready;
    //                         people._newInviteType = 'peopleSubcontractor';
    //                         people.markModified('invitePeople');
    //                         people._editUser = req.user;
    //                         people.save(function(err){
    //                             if (err) {return res.send(500,err);}
    //                             People.populate(people, 
    //                             [{path:"builders._id", select: "_id email name"},
    //                             {path:"builders.teamMember", select: "_id email name"},
    //                             {path:"architects._id", select: "_id email name"},
    //                             {path:"architects.teamMember", select: "_id email name"},
    //                             {path:"clients._id", select: "_id email name"},
    //                             {path:"clients.teamMember", select: "_id email name"},
    //                             {path:"subcontractors._id", select: "_id email name"},
    //                             {path:"subcontractors.teamMember", select: "_id email name"},
    //                             {path: "consultants._id", select: "_id email name"},
    //                             {path: "consultants.teamMember", select: "_id email name"}
    //                             ], function(err, people) {
    //                                 return res.json(people);
    //                             });
    //                         });
    //                     }, 2000);
    //                 }
    //             }
    //         } else if (invite.type == 'addConsultant') {
    //             if (invite.isTender) {
    //                 var consultants = people.consultants;
    //                 async.each(invite.invitees, function(invitee, cb) {
    //                     User.findOne({email: invitee.email}, function(err, consultant) {
    //                         if (err) {return cb(err);}
    //                         if (!consultant) {
    //                             consultants.push({
    //                                 inviter: req.user._id,
    //                                 inviterType: invite.inviterType,
    //                                 email: invitee.email
    //                             });
    //                             newInviteeNotSignUp.push(invitee.email);
    //                             cb();
    //                         } else {
    //                             consultants.push({
    //                                 inviter: req.user._id,
    //                                 inviterType: invite.inviterType,
    //                                 _id: consultant._id
    //                             });
    //                             newInviteeSignUpAlready.push(consultant._id);
    //                             consultant.projects.push(people.project);
    //                             consultant.markModified('projects');
    //                             consultant.save(cb());
    //                         }
    //                     })
    //                 }, function(err) {
    //                     if (err) {return res.send(500,err);}
    //                     people.consultants = consultants;
    //                     people._newInviteeNotSignUp = newInviteeNotSignUp;
    //                     people._newInviteeSignUpAlready = newInviteeSignUpAlready;
    //                     people._newInviteType = 'peopleConsultant';
    //                     people.markModified('invitePeople');
    //                     people._editUser = req.user;
    //                     people.save(function(err){
    //                         if (err) {return res.send(500,err);}
    //                         People.populate(people, 
    //                         [{path:"builders._id", select: "_id email name"},
    //                         {path:"builders.teamMember", select: "_id email name"},
    //                         {path:"architects._id", select: "_id email name"},
    //                         {path:"architects.teamMember", select: "_id email name"},
    //                         {path:"clients._id", select: "_id email name"},
    //                         {path:"clients.teamMember", select: "_id email name"},
    //                         {path:"subcontractors._id", select: "_id email name"},
    //                         {path:"subcontractors.teamMember", select: "_id email name"},
    //                         {path: "consultants._id", select: "_id email name"},
    //                         {path: "consultants.teamMember", select: "_id email name"}
    //                         ], function(err, people) {
    //                             return res.json(people);
    //                         });
    //                     });
    //                 });
    //             } else {
    //                 if (invite.isInviteTeamMember) {
    //                     var consultants = people.consultants;
    //                     _.each(consultants, function(consultant){
    //                         if (consultant._id) {
    //                             if (consultant._id.toString() == req.user._id.toString()) {
    //                                 async.each(invite.teamMember, function(member, cb) {
    //                                     User.findById(member._id, function(err, user) {
    //                                         if (err || !user) {return cb(err);}
    //                                         else {
    //                                             newInviteeSignUpAlready.push(user._id);
    //                                             consultant.teamMember.push(user._id);
    //                                             user.projects.push(people.project);
    //                                             user.markModified('projects');
    //                                             user.save(cb());
    //                                         }
    //                                     });
    //                                 }, function(){
    //                                     people.consultant = consultants;
    //                                     people._newInviteeNotSignUp = newInviteeNotSignUp;
    //                                     people._newInviteeSignUpAlready = newInviteeSignUpAlready;
    //                                     people._newInviteType = 'peopleSubcontractor';
    //                                     people.markModified('invitePeople');
    //                                     people._editUser = req.user;
    //                                     people.save(function(err){
    //                                         if (err) {return res.send(500,err);}
    //                                         People.populate(people, 
    //                                         [{path:"builders._id", select: "_id email name"},
    //                                         {path:"builders.teamMember", select: "_id email name"},
    //                                         {path:"architects._id", select: "_id email name"},
    //                                         {path:"architects.teamMember", select: "_id email name"},
    //                                         {path:"clients._id", select: "_id email name"},
    //                                         {path:"clients.teamMember", select: "_id email name"},
    //                                         {path:"subcontractors._id", select: "_id email name"},
    //                                         {path:"subcontractors.teamMember", select: "_id email name"},
    //                                         {path: "consultants._id", select: "_id email name"},
    //                                         {path: "consultants.teamMember", select: "_id email name"},
    //                                         {path: "consultants.inviter", select: "_id email name"}
    //                                         ], function(err, people) {
    //                                             return res.json(people);
    //                                         });
    //                                     });
    //                                 });
    //                             } 
    //                         }
    //                     });
    //                 } else {
    //                     var consultants = people.consultants;
    //                     User.findOne({email: invite.email}, function(err, consultant) {
    //                         if (err) {return res.send(500,err);}
    //                         if (!consultant) {
    //                             consultants.push({
    //                                 inviter: req.user._id,
    //                                 inviterType: invite.inviterType,
    //                                 email: invite.email,
    //                                 hasSelect: true
    //                             });
    //                             newInviteeNotSignUp.push(invite.email);
    //                         } else {
    //                             consultants.push({
    //                                 inviter: req.user._id,
    //                                 inviterType: invite.inviterType,
    //                                 _id: consultant._id,
    //                                 hasSelect: true
    //                             });
    //                             newInviteeSignUpAlready.push(consultant._id);
    //                             consultant.projects.push(people.project);
    //                             consultant.markModified('projects');
    //                             consultant.save();
    //                         }
    //                     });
    //                     setTimeout(function() {
    //                         _.each(consultants, function(item) {
    //                             if (item.inviter == req.user._id && !item.hasSelect) {
    //                                 if (item._id) {
    //                                     User.findById(item._id, function(err, user) {
    //                                         if (err) {return res.send(500,err);}
    //                                         if (!user) {return res.send(404);}
    //                                         var index = user.projects.indexOf(people.project);
    //                                         user.projects.splice(index,1);
    //                                         user.markModified('projects');
    //                                         user.save();
    //                                     });
    //                                 }
    //                             }
    //                         });
    //                         people.consultants = consultants;
    //                         people._newInviteeNotSignUp = newInviteeNotSignUp;
    //                         people._newInviteeSignUpAlready = newInviteeSignUpAlready;
    //                         people._newInviteType = 'peopleConsultant';
    //                         people.markModified('invitePeople');
    //                         people._editUser = req.user;
    //                         people.save(function(err){
    //                             if (err) {return res.send(500,err);}
    //                             People.populate(people, 
    //                             [{path:"builders._id", select: "_id email name"},
    //                             {path:"builders.teamMember", select: "_id email name"},
    //                             {path:"architects._id", select: "_id email name"},
    //                             {path:"architects.teamMember", select: "_id email name"},
    //                             {path:"clients._id", select: "_id email name"},
    //                             {path:"clients.teamMember", select: "_id email name"},
    //                             {path:"subcontractors._id", select: "_id email name"},
    //                             {path:"subcontractors.teamMember", select: "_id email name"},
    //                             {path: "consultants._id", select: "_id email name"},
    //                             {path: "consultants.teamMember", select: "_id email name"}
    //                             ], function(err, people) {
    //                                 return res.json(people);
    //                             });
    //                         });
    //                     }, 2000);
    //                 }
    //             }
    //         } else {
    //             return res.send(500);
    //         }
    //     }
    // });
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
    .populate("builders._id", "_id email name")
    .populate("builders.teamMember", "_id email name")
    .populate("architects._id", "_id email name")
    .populate("architects.teamMember", "_id email name")
    .populate("clients._id", "_id email name")
    .populate("clients.teamMember", "_id email name")
    .populate("subcontractors._id", "_id email name")
    .populate("subcontractors.teamMember", "_id email name")
    .populate("subcontractors.inviter", "_id email name")
    .populate("consultants._id", "_id email name")
    .populate("consultants.teamMember", "_id email name")
    .populate("consultants.inviter", "_id email name")
    .populate("projectManager.teamMember", "_id email name")
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

function responseWithEachType(people, req, res){
    var roles = ["builders", "clients", "architects", "subcontractors", "consultants"];
    _.each(roles, function(role) {
        var index = _.findIndex(people[role], function(user) {
            if (user._id) {
                return user._id._id.toString() === req.user._id.toString();
            }
        });
        if (index != -1) {
            console.log(role);
            switch (role) {
                case 'builders':
                    break;
                case 'clients':
                    people.builders.teamMember = [];
                    people.architects.teamMember = [];
                    people.subcontractors.teamMember = [];
                    people.consultants.teamMember = [];
                    people.projectManager.teamMember = [];
                    people.subcontractors = [];
                    return res.send(200, people);
                    break;
                default:
                    break;
            }
        }
    });
};