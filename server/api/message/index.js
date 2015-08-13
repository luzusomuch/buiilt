'use strict';

var express = require('express');
var controller = require('./message.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.post('/:id/:type', auth.isAuthenticated(), controller.package, controller.create);
router.post('/:id/:type/message', auth.isAuthenticated(), controller.thread, controller.saveMessage);
router.put('/:id/:type', auth.isAuthenticated(), controller.thread, controller.update);
router.get('/list', auth.isAuthenticated(), controller.getAll);
router.get('/:id', auth.isAuthenticated(), controller.getById);
router.get('/:id/:type', auth.isAuthenticated(), controller.package, controller.getMessages);
router.get('/:id/:type/get-by-package', auth.isAuthenticated(), controller.getByPackage);
router.get('/:id/:type/one', auth.isAuthenticated(), controller.thread, controller.getOne);
router.get('/:id/dashboard/me', auth.isAuthenticated(),controller.project, controller.myThread);

module.exports = router;
