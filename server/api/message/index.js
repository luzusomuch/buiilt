'use strict';

var express = require('express');
var controller = require('./message.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/:id/:type', auth.isAuthenticated(), controller.package, controller.create);
router.post('/:id/:type/message', auth.isAuthenticated(), controller.thread, controller.saveMessage);
router.put('/:id/:type', auth.isAuthenticated(), controller.thread, controller.update);
router.get('/:id/:type', auth.isAuthenticated(), controller.package, controller.getMessages);
router.get('/:id/:type/one', auth.isAuthenticated(), controller.thread, controller.getOne);
router.get('/me', auth.isAuthenticated(), controller.myThread);

module.exports = router;
