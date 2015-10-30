'use strict';

var Board = require('./../../models/board.model');
var User = require('./../../models/user.model');
var _ = require('lodash');
var async = require('async');
var EventBus = require('../../components/EventBus');

exports.createBoard = function(req, res) {
    var board = new Board({
        project: req.params.id,
        owner: req.user._id,
        name: req.body.name
    });
    var invitees = [];
    async.each(req.body.invitees, function(invitee, cb) {
        User.findById(invitee._id, function(err, user) {
            if (err || !user) {return cb(err);}
            else {
                invitees.push({_id: user._id});
                user.projects.push(req.params.id);
                user.markModified('projects');
                user.save(cb());
            }
        });
    }, function() {
        board.invitees = invitees;
        board.save(function(err) {
            if (err) {return res.send(500,err);}
            Board.populate(board, [
                {path: 'invitees._id', select: '_id email name'},
                {path: 'owner', select: '_id email name'}
                ], function(err, board) {
                return res.send(200, board);
            });
        });
    });
};

exports.invitePeople = function(req, res) {
    Board.findById(req.params.id, function(err, board) {
        if (err) {return res.send(500,err);}
        if (!board) {return res.send(404);}
        User.findOne({email: req.body.email}, function(err, user){
            if (err) {return res.send(500,err);}
            if (!user) {
                board.invitees.push({email: req.body.email});
                board._inviteEmail = req.body.email;
            } else {
                board.invitees.push({_id: user._id});
                board._inviteUser = user._id;
                user.projects.push(board.project);
                user.markModified('projects');
                user.save();
            }
            board.markModified('invitePeople');
            board.save(function(err){
                if (err) {return res.send(500,err);}
                Board.populate(board, [
                    {path: 'invitees._id', select: '_id email name'},
                    {path: 'owner', select: '_id email name'},
                    {path: 'messages.user', select: '_id email name'}
                    ], function(err, board) {
                    return res.send(200, board);
                });
            });
        });
    });
};

exports.getBoards = function(req, res) {
    Board.find({project: req.params.id})
    .populate('owner', '_id email name')
    .populate('invitees._id', '_id email name')
    .populate('messages.user', '_id email name').exec(function(err, boards) {
        if (err) {return res.send(500,err);}
        return res.send(200, boards);
    });
};

exports.sendMessage = function(req, res) {
    Board.findById(req.params.id, function(err, board){
        if (err) {return res.send(500,err);}
        if (!board) {return res.send(404);}
        board.messages.push({
            user: req.user._id,
            text: req.body.text,
            sendAt: new Date()
        });
        board._editUser = req.user;
        board.markModified('sendMessage');
        board.save(function(err){
            if (err) {return res.send(500,err);}
            Board.populate(board, [
            {path: 'invitees._id', select: '_id email name'},
            {path: 'owner', select: '_id email name'},
            {path: 'messages.user', select: '_id email name'}
            ], function(err, board) {
                EventBus.emit('socket:emit', {
                    event: 'boardChat:new',
                    room: board._id.toString(),
                    data: board
                });
                return res.send(200, board);
            });
        });
    });
};