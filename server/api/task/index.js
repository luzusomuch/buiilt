'use strict';

var express = require('express');
var controller = require('./task.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/:id/:type', auth.isAuthenticated(), controller.package, controller.create);
router.put('/:id/:type', auth.isAuthenticated(), controller.task, controller.update);
router.get('/:id/:type', auth.isAuthenticated(), controller.package, controller.getTask);
router.get('/me/', auth.isAuthenticated(), controller.myTask);

module.exports = router;
