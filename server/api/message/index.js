'use strict';

var express = require('express');
var controller = require('./message.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();
router.delete('/:id', auth.isAuthenticated(), controller.destroy);
router.post('/reply-message', controller.replyMessage);
router.post('/:id', auth.isAuthenticated(), controller.create);
router.post('/:id/message', auth.isAuthenticated(), controller.sendMessage);

router.get('/dashboard/me', auth.isAuthenticated(), controller.myThread);
router.get('/:id', auth.isAuthenticated(), controller.getById);
router.get('/:id/project-thread', auth.isAuthenticated(), controller.getProjectThread);
router.get('/:id/last-access', auth.isAuthenticated(), controller.lastAccess);

router.put('/:id', auth.isAuthenticated(), controller.update);
module.exports = router;
