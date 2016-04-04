'use strict';

var People = require('./../../models/people.model');
var PeopleChat = require('./../../models/peopleChat.model');
var User = require('./../../models/user.model');
var _ = require('lodash');
var async = require('async');
var EventBus = require('../../components/EventBus');
var mongoose = require('mongoose');

exports.selectPeople = function(req, res) {
    console.log(req.body);
    if (req.body.user._id) {
        if (req.body.user.type == "team") {
            PeopleChat.findOne({project: req.body.project, people: req.params.id, $or:[{owner: req.body.user._id, from: req.user._id},{owner: req.user._id, from: req.body.user._id}]}, function(err, chat) {
                if (err) {return res.send(500,err);}
                if (!chat) {
                    var peopleChat = new PeopleChat({
                        project: req.body.project,
                        people: req.params.id,
                        owner: mongoose.Types.ObjectId(req.body.user._id),
                        from: req.user._id,
                        members: [mongoose.Types.ObjectId(req.body.user._id), req.user._id]
                    });
                    peopleChat.save(function(err){
                        if (err) {return res.send(500);}
                        return res.send(peopleChat);
                    });
                } else {
                    PeopleChat.populate(chat, 
                    [{path: "messages.user", select: "_id email name"},
                    {path: "messages.mentions", select: "_id email name"}], function(err, chat) {
                        return res.json(chat);
                    });
                }
            });
        } else {
            PeopleChat.findOne({project: req.body.project, people: req.params.id, $or:[{owner: req.body.user._id._id, from: req.user._id},{owner: req.user._id, from: req.body.user._id._id}]}, function(err, chat) {
                if (err) {return res.send(500,err);}
                if (!chat) {
                    var peopleChat = new PeopleChat({
                        project: req.body.project,
                        people: req.params.id,
                        owner: req.body.user._id._id,
                        from: req.user._id,
                        members: [req.body.user._id._id, req.user._id]
                    });
                    peopleChat.save(function(err){
                        if (err) {return res.send(500);}
                        return res.send(peopleChat);
                    });
                } else {
                    PeopleChat.populate(chat, 
                    [{path: "messages.user", select: "_id email name"},
                    {path: "messages.mentions", select: "_id email name"}], function(err, chat) {
                        return res.json(chat);
                    });
                }
            });
        }
    } else {
        PeopleChat.findOne({project: req.body.project, people: req.params.id, $or:[{ownerEmail: req.body.user.email, from: req.user._id},{owner: req.user._id, fromEmail: req.body.user.email}]}, function(err, chat) {
            if (err) {console.log(err);return res.send(500,err);}
            console.log(chat);
            if (!chat) {
                var peopleChat = new PeopleChat({
                    project: req.body.project,
                    people: req.params.id,
                    ownerEmail: req.body.user.email,
                    from: req.user._id,
                    members: [req.user._id]
                });
                peopleChat.save(function(err){
                    if (err) {console.log(err);return res.send(500);}
                    return res.send(peopleChat);
                });
            } else {
                PeopleChat.populate(chat, 
                [{path: "messages.user", select: "_id email name"},
                {path: "messages.mentions", select: "_id email name"}], function(err, chat) {
                    return res.json(chat);
                });
            }
        });
    }
};

exports.sendMessage = function(req, res) {
    PeopleChat.findById(req.params.id, function(err, chat){
        if (err) {return res.send(500,err);}
        if (!chat) {return res.send(404);}
        else {
            chat.messages.push({
                user: req.user._id,
                text: req.body.text,
                mentions: req.body.mentions,
                sendAt: new Date()
            });
            chat._editUser = req.user;
            chat.save(function(err){
                if (err) {return res.send(500,err);}
                PeopleChat.populate(chat, 
                [{path: "messages.user", select: "_id email name"},
                {path: "messages.mentions", select: "_id email name"}], function(err, chat) {
                    EventBus.emit('socket:emit', {
                        event: 'peopleChat:new',
                        room: chat._id.toString(),
                        data: chat
                    });
                    return res.json(chat);
                });
            });
        }
    });
};

exports.replyMessageFromEmail = function(req, res) {
    PeopleChat.findById(req.params.id, function(err, chat) {
        if (err) {return res.send(500,err);}
        if (!chat) {return res.send(404);}
        chat.messages.push({
            user: req.params.replier,
            text: req.body.message,
            mentions: [],
            sendAt: new Date()
        });
        User.findById(req.params.replier, function(err, user) {
            if (err) {return res.send(500,err);}
            if (!user) {return res.send(404);}
            chat._editUser = user;
            chat.save(function(err) {
                if (err) {return res.send(500,err);}
                PeopleChat.populate(chat, 
                [{path: "messages.user", select: "_id email name"},
                {path: "messages.mentions", select: "_id email name"}], function(err, chat) {
                    EventBus.emit('socket:emit', {
                        event: 'peopleChat:new',
                        room: chat._id.toString(),
                        data: chat
                    });
                    return res.json(200, "Message has been sent!");
                });
            });
        });
    });
};

exports.get = function(req, res) {
    console.log(req.params.id);
    PeopleChat.findById(req.params.id)
    .populate('messages.user', '_id email name')
    .populate('messages.mentions', '_id email name')
    .populate('members', '_id email name')
    .populate('project')
    .exec(function(err, chat){
        if (err) {return res.send(500,err);}
        if (!chat) {console.log("not found data");return res,send(404);}
        else {
            return res.send(200, chat);
        }
    });
};