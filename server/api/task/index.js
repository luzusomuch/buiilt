'use strict';

var express = require('express');
var controller = require('./task.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/:id/:type', auth.isAuthenticated(), controller.package, controller.create);
router.put('/:id/:type', auth.isAuthenticated(), controller.task, controller.update);
router.get('/:id', auth.isAuthenticated(), controller.getOne);
router.get('/:id/:type', auth.isAuthenticated(), controller.package, controller.getTask);
router.get('/:id/dashboard/me', auth.isAuthenticated(),controller.project, controller.myTask);
router.get('/list', auth.isAuthenticated(), controller.getAll);

module.exports = router;
