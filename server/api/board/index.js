'use strict';

var express = require('express');
var controller = require('./board.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/:id', auth.isAuthenticated(), controller.createBoard);
router.post('/:id/send-message', auth.isAuthenticated(), controller.sendMessage);
router.post('/:id/:replier/reply-message-from-email', controller.replyMessageFromEmail);
router.put('/:id', auth.isAuthenticated(), controller.invitePeople);
router.get('/:id', auth.isAuthenticated(), controller.getBoards);
router.get('/:id/get-board-ios', auth.isAuthenticated(), controller.getBoardIOS);
module.exports = router;
