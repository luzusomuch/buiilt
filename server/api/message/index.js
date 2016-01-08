'use strict';

var express = require('express');
var controller = require('./message.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.post('/reply-message', controller.replyMessage);
router.post('/:id', auth.isAuthenticated(), controller.create);
router.post('/:id/message', auth.isAuthenticated(), controller.sendMessage);

router.get('/dashboard/me', auth.isAuthenticated(), controller.myThread);
router.get('/:id', auth.isAuthenticated(), controller.getById);
router.get('/:id/project-thread', auth.isAuthenticated(), controller.getProjectThread);

router.put('/:id', auth.isAuthenticated(), controller.update);
// router.get('/list', auth.isAuthenticated(), controller.getAll);
// router.get('/list-by-user', auth.isAuthenticated(), controller.getAllByUser);
// router.get('/:id/list-by-project', auth.isAuthenticated(), controller.getAllByProject);
// router.get('/:id/get-thread', auth.isAuthenticated(), controller.getThreadById);
// router.get('/:id/:type', auth.isAuthenticated(), controller.package, controller.getMessages);
// router.get('/:id/:type/ios', auth.isAuthenticated(), controller.package, controller.getMessagesIos);
// router.get('/:id/:type/get-by-package', auth.isAuthenticated(), controller.getByPackage);
// router.get('/:id/:type/one', auth.isAuthenticated(), controller.thread, controller.getOne);

module.exports = router;
