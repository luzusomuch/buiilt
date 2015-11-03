'use strict';

var People = require('./../../models/people.model');
var PeopleChat = require('./../../models/peopleChat.model');
var User = require('./../../models/user.model');
var _ = require('lodash');
var async = require('async');
var EventBus = require('../../components/EventBus');

exports.selectPeople = function(req, res) {
    PeopleChat.findOne({project: req.body.project, people: req.params.id, $or:[{owner: req.body.user, from: req.user._id},{owner: req.user._id, from: req.body.user}]}, function(err, chat) {
        if (err) {return res.send(500,err);}
        console.log(chat);
        if (!chat) {
            var peopleChat = new PeopleChat({
                project: req.body.project,
                people: req.params.id,
                owner: req.body.user,
                from: req.user._id,
                members: [req.body.user, req.user._id]
            });
            peopleChat.save(function(err){
                if (err) {return res.send(500);}
                return res.send(peopleChat);
            });
        } else {
            PeopleChat.populate(chat, 
            [{path: "messages.user", select: "_id email name"}], function(err, chat) {
                return res.json(chat);
            });
        }
    });
};

exports.sendMessage = function(req, res) {
    PeopleChat.findById(req.params.id, function(err, chat){
        if (err) {return res.send(500,err);}
        if (!chat) {return res.send(404);}
        else {
            chat.messages.push({
                user: req.user._id,
                text: req.body.text,
                sendAt: new Date()
            });
            chat._editUser = req.user;
            chat.save(function(err){
                if (err) {return res.send(500,err);}
                PeopleChat.populate(chat, 
                [{path: "messages.user", select: "_id email name"}], function(err, chat) {
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