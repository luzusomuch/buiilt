'use strict';

var People = require('./../../models/people.model');
var User = require('./../../models/user.model');
var _ = require('lodash');
var async = require('async');

exports.invitePeople = function(req, res) {
    console.log('it goes there');
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
                var architects = people.architects;
                var newInviteeNotSignUp = [];
                var newInviteeSignUpAlready = [];
                async.each(invite.invitees, function(invitee, cb) {
                    User.findOne({email: invitee.email}, function(err, architect) {
                        if (err) {return cb(err);}
                        if (!architect) {
                            architects.push({
                                inviter: req.user._id,
                                email: invitee.email
                            });
                            newInviteeNotSignUp.push(invitee.email);
                            cb();
                        } else {
                            architects.push({
                                inviter: req.user._id,
                                _id: architect._id
                            });
                            newInviteeSignUpAlready.push(architect._id);
                            architect.projects.push(people.project);
                            architect.markModified('projects');
                            architect.save(cb());
                        }
                    })
                }, function(err) {
                    if (err) {return res.send(500,err);}
                    people.architects = architects;
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
            } else if (invite.type == 'addClient') {
                var clients = people.clients;
                var newInviteeNotSignUp = [];
                var newInviteeSignUpAlready = [];
                async.each(invite.invitees, function(invitee, cb) {
                    User.findOne({email: invitee.email}, function(err, client) {
                        if (err) {return cb(err);}
                        if (!client) {
                            clients.push({
                                inviter: req.user._id,
                                email: invitee.email
                            });
                            newInviteeNotSignUp.push(invitee.email);
                            cb();
                        } else {
                            clients.push({
                                inviter: req.user._id,
                                _id: client._id
                            });
                            newInviteeSignUpAlready.push(client._id);
                            client.projects.push(people.project);
                            client.markModified('projects');
                            client.save(cb());
                        }
                    })
                }, function(err) {
                    if (err) {return res.send(500,err);}
                    people.clients = clients;
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
            } else if (invite.type == 'addSubcontractor') {
                var subcontractors = people.subcontractors;
                var newInviteeNotSignUp = [];
                var newInviteeSignUpAlready = [];
                async.each(invite.invitees, function(invitee, cb) {
                    User.findOne({email: invitee.email}, function(err, subcontractor) {
                        if (err) {return cb(err);}
                        if (!subcontractor) {
                            subcontractors.push({
                                inviter: req.user._id,
                                email: invitee.email
                            });
                            newInviteeNotSignUp.push(invitee.email);
                            cb();
                        } else {
                            subcontractors.push({
                                inviter: req.user._id,
                                _id: subcontractor._id
                            });
                            newInviteeSignUpAlready.push(subcontractor._id);
                            subcontractor.projects.push(people.project);
                            subcontractor.markModified('projects');
                            subcontractor.save(cb());
                        }
                    })
                }, function(err) {
                    if (err) {return res.send(500,err);}
                    people.subcontractors = subcontractors;
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
            } else if (invite.type == 'addConsultant') {
                var consultants = people.consultants;
                var newInviteeNotSignUp = [];
                var newInviteeSignUpAlready = [];
                async.each(invite.invitees, function(invitee, cb) {
                    User.findOne({email: invitee.email}, function(err, consultant) {
                        if (err) {return cb(err);}
                        if (!consultant) {
                            consultants.push({
                                inviter: req.user._id,
                                email: invitee.email
                            });
                            newInviteeNotSignUp.push(invitee.email);
                            cb();
                        } else {
                            consultants.push({
                                inviter: req.user._id,
                                _id: consultant._id
                            });
                            newInviteeSignUpAlready.push(consultant._id);
                            consultant.projects.push(people.project);
                            consultant.markModified('projects');
                            consultant.save(cb());
                        }
                    })
                }, function(err) {
                    if (err) {return res.send(500,err);}
                    people.consultants = consultants;
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
            } else {
                return res.send(500);
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
            if (req.body.type == 'subcontractor') {
                var winnerTender = _.remove(people.subcontractors, function(item) {
                    return item.inviter == req.body.tender.inviter && item._id == req.body.tender._id._id;
                });
                winnerTender[0].hasSelect = true;
                winnerTenderNotification.push(req.body.tender._id._id);
                _.each(people.subcontractors, function(subcontractor) {
                    if (subcontractor._id) {
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
                    {path:"architects._id", select: "_id email name"},
                    {path:"clients._id", select: "_id email name"},
                    {path:"subcontractors._id", select: "_id email name"},
                    {path: "consultants._id", select: "_id email name"}], function(err, people) {
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
                    {path:"architects._id", select: "_id email name"},
                    {path:"clients._id", select: "_id email name"},
                    {path:"subcontractors._id", select: "_id email name"},
                    {path: "consultants._id", select: "_id email name"}], function(err, people) {
                        return res.json(people);
                    });
                });
            } else if (req.body.type == 'consultant') {
                var winnerTender = _.remove(people.consultants, function(item) {
                    return item.inviter == req.body.tender.inviter && item._id == req.body.tender._id._id;
                });
                winnerTender[0].hasSelect = true;
                winnerTenderNotification.push(req.body.tender._id._id);
                _.each(people.consultants, function(consultant) {
                    if (consultant._id) {
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
                    {path:"architects._id", select: "_id email name"},
                    {path:"clients._id", select: "_id email name"},
                    {path:"subcontractors._id", select: "_id email name"},
                    {path: "consultants._id", select: "_id email name"}], function(err, people) {
                        return res.json(people);
                    });
                });
            } else if (req.body.type == 'client') {
                var winnerTender = _.remove(people.clients, function(item) {
                    return item.inviter == req.body.tender.inviter && item._id == req.body.tender._id._id;
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
                    {path:"architects._id", select: "_id email name"},
                    {path:"clients._id", select: "_id email name"},
                    {path:"subcontractors._id", select: "_id email name"},
                    {path: "consultants._id", select: "_id email name"}], function(err, people) {
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
                    {path:"architects._id", select: "_id email name"},
                    {path:"clients._id", select: "_id email name"},
                    {path:"subcontractors._id", select: "_id email name"},
                    {path: "consultants._id", select: "_id email name"}], function(err, people) {
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