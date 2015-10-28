'use strict';

var People = require('./../../models/people.model');
var User = require('./../../models/user.model');
var _ = require('lodash');
var async = require('async');

exports.invitePeople = function(req, res) {
    var invite = req.body;
    People.findOne({project:req.params.id}, function(err, people){
        if (err) {return res.send(500,err);}
        if (!people) {return res.send(404,err);}
        else {
            if (invite.type == 'addBuilder') {
                var builders = people.builders;
                var newInviteeNotSignUp = [];
                var newInviteeSignUpAlready = [];
                async.each(invite.invitees, function(invitee, cb) {
                    User.findOne({email: invitee.email}, function(err, builder) {
                        if (err) {return cb(err);}
                        if (!builder) {
                            builders.push({
                                inviter: req.user._id,
                                email: invitee.email
                            });
                            newInviteeNotSignUp.push(invitee.email);
                            cb();
                        } else {
                            builders.push({
                                inviter: req.user._id,
                                _id: builder._id
                            });
                            newInviteeSignUpAlready.push(builder._id);
                            builder.projects.push(people.project);
                            builder.markModified('projects');
                            builder.save(cb());
                        }
                    })
                }, function(err) {
                    if (err) {return res.send(500,err);}
                    people.builders = builders;
                    people._newInviteeNotSignUp = newInviteeNotSignUp;
                    people._newInviteeSignUpAlready = newInviteeSignUpAlready;
                    people._newInviteType = 'peopleBuilder';
                    people.markModified('invitePeople');
                    people._editUser = req.user;
                    people.save(function(err){
                        if (err) {return res.send(500,err);}
                        People.populate(people, 
                        [{path:"builders._id", select: "_id email name"},
                        {path:"architects._id", select: "_id email name"},
                        {path:"clients._id", select: "_id email name"},
                        {path:"subcontractors._id", select: "_id email name"},
                        {path: "consultants._id", select: "_id email name"}], function(err, people) {
                            return res.json(people);
                        });
                    });
                });
            } else if (invite.type == 'addArchitect') {
                User.findOne({'email': invite.email}, function(err, architect) {
                    if (err) {return res.send(500,err);}
                    if (!architect) {
                        people.architects.push({
                            inviter: req.user._id,
                            email: invite.email
                        });
                        people._newInvitee = invite.email;
                        people._newInviteType = 'peopleArchitect';
                    } else {
                        people.architects.push({
                            inviter: req.user._id,
                            _id: architect._id
                        });
                        architect.projects.push(people.project);
                        architect.markModified('projects');
                        architect.save();
                    }
                    people.markModified('invitePeople');
                    people._editUser = req.user;
                    people.save(function(err){
                        if (err) {return res.send(500,err);}
                        People.populate(people, 
                        [{path:"builders._id", select: "_id email name"},
                        {path:"architects._id", select: "_id email name"},
                        {path:"clients._id", select: "_id email name"},
                        {path:"subcontractors._id", select: "_id email name"},
                        {path: "consultants._id", select: "_id email name"}], function(err, people) {
                            return res.json(people);
                        });
                    });
                });
            } else if (invite.type == 'addClient') {
                User.findOne({'email': invite.email}, function(err, client) {
                    if (err) {return res.send(500,err);}
                    if (!client) {
                        people.clients.push({
                            inviter: req.user._id,
                            email: invite.email
                        });
                        people._newInvitee = invite.email;
                        people._newInviteType = 'peopleClient';
                    } else {
                        people.clients.push({
                            inviter: req.user._id,
                            _id: client._id
                        });
                        client.projects.push(people.project);
                        client.markModified('projects');
                        client.save();
                    }
                    people.markModified('invitePeople');
                    people._editUser = req.user;
                    people.save(function(err){
                        if (err) {return res.send(500,err);}
                        People.populate(people, 
                        [{path:"builders._id", select: "_id email name"},
                        {path:"architects._id", select: "_id email name"},
                        {path:"clients._id", select: "_id email name"},
                        {path:"subcontractors._id", select: "_id email name"},
                        {path: "consultants._id", select: "_id email name"}], function(err, people) {
                            return res.json(people);
                        });
                    });
                });
            } else if (invite.type == 'addSubcontractor') {
                User.findOne({'email': invite.email}, function(err, contractor) {
                    if (err) {return res.send(500,err);}
                    if (!contractor) {
                        people.subcontractors.push({
                            inviter: req.user._id,
                            email: invite.email
                        });
                        people._newInvitee = invite.email;
                        people._newInviteType = 'peopleSubcontractor';
                    } else {
                        people.subcontractors.push({
                            inviter: req.user._id,
                            _id: contractor._id
                        });
                        contractor.projects.push(people.project);
                        contractor.markModified('projects');
                        contractor.save();
                    }
                    people.markModified('invitePeople');
                    people._editUser = req.user;
                    people.save(function(err){
                        if (err) {return res.send(500,err);}
                        People.populate(people, 
                        [{path:"builders._id", select: "_id email name"},
                        {path:"architects._id", select: "_id email name"},
                        {path:"clients._id", select: "_id email name"},
                        {path:"subcontractors._id", select: "_id email name"},
                        {path: "consultants._id", select: "_id email name"}], function(err, people) {
                            return res.json(people);
                        });
                    });
                });
            } else if (invite.type == 'addConsultant') {
                User.findOne({'email': invite.email}, function(err, consultant) {
                    if (err) {return res.send(500,err);}
                    if (!consultant) {
                        people.consultants.push({
                            inviter: req.user._id,
                            email: invite.email
                        });
                        people._newInvitee = invite.email;
                        people._newInviteType = 'peopleConsultant';
                    } else {
                        people.consultants.push({
                            inviter: req.user._id,
                            _id: consultant._id
                        });
                        consultant.projects.push(people.project);
                        consultant.markModified('projects');
                        consultant.save();
                    }
                    people.markModified('invitePeople');
                    people._editUser = req.user;
                    people.save(function(err){
                        if (err) {return res.send(500,err);}
                        People.populate(people, 
                        [{path:"builders._id", select: "_id email name"},
                        {path:"architects._id", select: "_id email name"},
                        {path:"clients._id", select: "_id email name"},
                        {path:"subcontractors._id", select: "_id email name"},
                        {path: "consultants._id", select: "_id email name"}], function(err, people) {
                            return res.json(people);
                        });
                    });
                });
            } else {
                return res.send(500);
            }
        }
    });
};

exports.getInvitePeople = function(req, res) {
    console.log(req.params.id);
    People.findOne({project: req.params.id})
    .populate("builders._id", "_id email name")
    .populate("architects._id", "_id email name")
    .populate("clients._id", "_id email name")
    .populate("subcontractors._id", "_id email name")
    .populate("consultants._id", "_id email name")
    .exec(function(err, people){
        if (err) {return res.send(500,err);}
        if (!people) {return res.send(404);}
        return res.send(200, people);
    });
};