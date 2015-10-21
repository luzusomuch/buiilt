'use strict';

var Board = require('./../../models/board.model');
var User = require('./../../models/user.model');
var _ = require('lodash');
var async = require('async');

exports.createBoard = function(req, res) {
    var board = new Board({
        project: req.params.id,
        owner: req.user._id,
        name: req.body.name
    });
    User.findOne({email: req.body.email}, function(err, user) {
        if (err) {return res.send(500,err);}
        if (!user) {
            board.invitees.push({email: req/body.email});
        } else {
            board.invitees.push({_id: user._id});
            user.projects.push(req.params.id);
            user.markModified('projects');
            user.save();
        }
        board.save(function(err){
            if (err) {return res.send(500,err);}
            Board.populate(board, [{path: 'invitees._id', select: '_id email name'}], function(err, board) {
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
            } else {
                board.invitees.push({_id: user._id});
                user.projects.push(board.project);
                user.markModified('projects');
                user.save();
            }
            board.save(function(err){
                if (err) {return res.send(500,err);}
                Board.populate(board, [{path: 'invitees._id', select: '_id email name'}], function(err, board) {
                    return res.send(200, board);
                });
            });
        });
    });
};

exports.getBoards = function(req, res) {
    Board.find({project: req.params.id})
    .populate('invitees._id', '_id email name').exec(function(err, boards) {
        if (err) {return res.send(500,err);}
        return res.send(200, boards);
    });
};