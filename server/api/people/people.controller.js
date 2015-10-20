'use strict';

var People = require('./../../models/people.model');
var User = require('./../../models/user.model');
var _ = require('lodash');
var async = require('async');

exports.invitePeople = function(req, res) {
    console.log(req.body);
    var invite = req.body;
    console.log(req.params);
    People.findOne({project:req.params.id}, function(err, people){
        if (err) {return res.send(500,err);}
        if (!people) {return res.send(404,err);}
        else {
            if (invite.type == 'addBuilder') {
                var _people = new People({});
                User.findOne({'email': invite.email}, function(err, builder) {
                    if (err) {return res.send(500,err);}
                    if (!builder) {
                        _people.builders.push({
                            email: invite.email
                        });
                    } else {
                        _people.builders.push({
                            _id: builder._id
                        });
                        builder.projects.push(people.project);
                    }
                    _people.markModified('builders');
                    _people.save(function(err){
                        if (err) {return res.send(500,err);}
                        return res.send(200,_people);
                    });
                });
            } else if (invite.type == 'addArchitect') {
                var _people = new People({});
                User.findOne({'email': invite.email}, function(err, architect) {
                    if (err) {return res.send(500,err);}
                    if (!architect) {
                        _people.architects.push({
                            email: invite.email
                        });
                    } else {
                        _people.architects.push({
                            _id: architect._id
                        });
                        architect.projects.push(people.project);
                    }
                    _people.markModified('architects');
                    _people.save(function(err){
                        if (err) {return res.send(500,err);}
                        return res.send(200,_people);
                    });
                });
            } else if (invite.type == 'addClient') {
                var _people = new People({});
                User.findOne({'email': invite.email}, function(err, client) {
                    if (err) {return res.send(500,err);}
                    if (!client) {
                        _people.clients.push({
                            email: invite.email
                        });
                    } else {
                        _people.clients.push({
                            _id: client._id
                        });
                        client.projects.push(people.project);
                    }
                    _people.markModified('clients');
                    _people.save(function(err){
                        if (err) {return res.send(500,err);}
                        return res.send(200,_people);
                    });
                });
            } else if (invite.type == 'addSubcontractor') {
                var _people = new People({});
                User.findOne({'email': invite.email}, function(err, contractor) {
                    if (err) {return res.send(500,err);}
                    if (!contractor) {
                        _people.subcontractors.push({
                            email: invite.email
                        });
                    } else {
                        _people.subcontractors.push({
                            _id: contractor._id
                        });
                        contractor.projects.push(people.project);
                    }
                    _people.markModified('subcontractors');
                    _people.save(function(err){
                        if (err) {return res.send(500,err);}
                        return res.send(200,_people);
                    });
                });
            } else if (invite.type == 'addConsultant') {
                var _people = new People({});
                User.findOne({'email': invite.email}, function(err, consultant) {
                    if (err) {return res.send(500,err);}
                    if (!consultant) {
                        _people.consultants.push({
                            email: invite.email
                        });
                    } else {
                        _people.consultants.push({
                            _id: consultant._id
                        });
                        consultant.projects.push(people.project);
                    }
                    _people.markModified('consultants');
                    _people.save(function(err){
                        if (err) {return res.send(500,err);}
                        return res.send(200,_people);
                    });
                });
            } else {
                return res.send(500);
            }
        }
    });
};