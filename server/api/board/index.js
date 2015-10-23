'use strict';

var express = require('express');
var controller = require('./board.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/:id', auth.isAuthenticated(), controller.createBoard);
router.post('/:id/send-message', auth.isAuthenticated(), controller.sendMessage);
router.put('/:id', auth.isAuthenticated(), controller.invitePeople);
router.get('/:id', auth.isAuthenticated(), controller.getBoards);
module.exports = router;
