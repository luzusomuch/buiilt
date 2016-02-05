'use strict';
var _ = require('lodash');
var async = require('async');
var User = require('./../../models/user.model');
var Project = require('./../../models/project.model');
var People = require('./../../models/people.model');
var Tender = require('./../../models/tender.model');

exports.create = function(req, res) {
    var data = req.body;
    var tender = new Tender({
        owner: req.user._id,
        ownerType: (data.project.projectManager.type === "architect") ? "architects" : "builders",
        project: data.project._id,
        name: data.name,
        description: data.description,
        dateEnd: data.dateEnd
    });
    tender.save(function(err) {
        if (err) {return res.send(500,err);}
        else {
            return res.send(200, tender);
        }
    });  
};

exports.getAll = function(req, res) {
    Tender.find({$or:[{owner: req.user._id}, {members: req.user._id}]}, function(err, tenders) {
        if (err) {return res.send(500,err);}
        else {
            return res.send(200, tenders);
        }
    });
};

exports.get = function(req, res) {
    Tender.findById(req.params.id)
    .populate("owner", "_id name email")
    .populate("members", "_id name email")
    .exec(function(err, tender) {
        if (err) {return res.send(500,err);}
        else if (!tender) {return res.send(404);}
        return res.send(200,tender);
    });
};