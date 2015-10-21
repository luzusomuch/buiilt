'use strict';

var express = require('express');
var controller = require('./peopleChat.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/:id/select-people', auth.isAuthenticated(), controller.selectPeople);
router.post('/:id/send-message', auth.isAuthenticated(), controller.sendMessage);
module.exports = router;
