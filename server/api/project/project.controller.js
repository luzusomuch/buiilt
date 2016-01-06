'use strict';

var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var ProjectValidator = require('./../../validators/project');
var People = require('./../../models/people.model');
var _ = require('lodash');
var async = require('async');
var json2csv = require('json2csv');
var Mailer = require('./../../components/Mailer');
var fs = require('fs');

exports.create = function(req, res){
    var user = req.user;
    ProjectValidator.validateCreate(req,function(err,data) {
        if (err) {
            res.send(422,err);
        }
        var project = new Project(data);
        project.status = 'waiting';
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
                    people.builders.push({
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
                    people.builders.push({
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
};


exports.index = function(req, res) {
  Project.find({'user._id': req.user._id}, function(err, projects) {
    if (err)
      return res.send(500, err);
    res.json(200, projects);
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
            // sendInfoToUser(req, res);
            return res.send(200, project);
        }
    });
};

exports.getAll = function(req, res) {
  Project.find({}, function(err, projects){
    if (err) {return res.send(500,err);}
    return res.send(200,projects)
  })
};

exports.destroy = function (req, res) {
  Project.findByIdAndRemove(req.params.id, function (err, project) {
    if (err) {
      return res.send(500, err);
    }
    Project.find({}, function(err,projects){
      if (err) {return res.send(500,err);}
      return res.send(200, projects);
    })
  });
};

exports.updateProject = function(req, res) {
    var data = req.body;
    Project.findById(req.params.id, function(err, project) {
        if (err) {return res.send(500,err);}
        else if (!project) {return res.send(404, "The specific project is not existed");}
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
                return res.send(200,project);
                // ongoing this sendInfoToUser()
            } else {
                return res.send(200,project);
            }
        });
    });
};

function sendInfoToUser(req, res) {
    //get people package
    People.findOne({project: req.project._id})
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
    .exec(function(err, people) {
        if (err || !people) {return res.send(200, req.project);}
        var roles = ["builders", "clients", "architects", "subcontractors", "consultants"];
        var usersList = [];
        var data = [];
        _.each(roles, function(role) {
            _.each(people[role], function(tender) {
                _.each(tender.tenderers, function(tenderer) {
                    if (tenderer._id) {
                        usersList.push(tenderer._id.email);
                        data.push({user: tenderer._id.email, title: 'Tender For '+tender.tenderName, inviter: 'Invited by '+tender.inviter.name});
                    }
                });
            });
        });
        _.each(data, function(d) {
            var user = d.user;

        }); 
        json2csv({data: data}, function(err, csv) {
            if (err) {console.log(err);}
            // fs.writeFile('file.csv', csv, function(err) {
            //     if (err) throw err;
            //     console.log('file saved');
            // });
        });
    });
};