'use strict';

var Document = require('./../../models/document.model');
var User = require('./../../models/user.model');
var _ = require('lodash');
var async = require('async');
var moment = require("moment");
var CheckMembers = require("./../../components/helpers/checkMembers");
var EventBus = require('../../components/EventBus');

exports.me = function(req, res) {
    Document.find({project: req.params.id, $or: [{owner: req.user._id}, {members: req.user._id}]})
    .populate("documents")
    .populate("members", "_id name email phoneNumber")
    .exec(function(err, documents) {
        if (err) {return res.send(500,err);}
        _.each(documents, function(document) {
            document.members = [];
            document.notMembers = [];
        });
        return res.send(200, documents);
    });
};

exports.create = function(req, res) {
    var data = req.body;
    if (!data.name) {
        return res.send(442, {msg: "Document name is required"});
    }
    var document = new Document({
        owner: req.user._id,
        name: data.name,
        project: req.params.id
    });
    if (req.query.isCopy) {
        document.documents = [];
        _.each(data.documents, function(doc) {
            document.documents.push(doc._id);
        }); 
    }
    CheckMembers.check(data.newMembers, null, function(result) {
        document.members = result.members;
        document.notMembers = result.notMembers;
        document.save(function(err) {
            if (err) {return res.send(500,err);}
            Document.populate(document, [
                {path: "owner", select: "_id name email phoneNumber"},
                {path: "members", select: "_id name email phoneNumber"},
                {path: "documents", select: "_id name tags project __v"}
            ], function() {
                var members = document.members;
                members.push(document.owner);
                _.each(members, function(member) {
                    EventBus.emit('socket:emit', {
                        event: 'document-set:new',
                        room: member._id.toString(),
                        data: document
                    });
                });
                return res.send(200, document);
            });
        });
    });
};

exports.update = function(req, res) {
    var data = req.body;
    Document.findById(req.params.id, function(err, document) {
        if (err) 
            return res.send(500);
        else if (!document) 
            return res.send(404);
        document.name = data.name;
        CheckMembers.check(data.newMembers, document, function(result) {
            document.members = result.members;
            document.notMembers = result.notMembers;
            document.save(function(err) {
                if (err) 
                    return res.send(500,err);
                Document.populate(document, [
                    {path: "owner", select: "_id name email phoneNumber"},
                    {path: "members", select: "_id name email phoneNumber"}
                ], function() {
                    var members = document.members;
                    members.push(document.owner);
                    _.each(members, function(member) {
                        EventBus.emit('socket:emit', {
                            event: 'document-set:update',
                            room: member._id.toString(),
                            data: document
                        });
                    });
                    return res.send(200, document);
                });
            });
        });
    });
};