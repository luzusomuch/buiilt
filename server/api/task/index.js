'use strict';

var express = require('express');
var controller = require('./task.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post("/:id", auth.isAuthenticated(), controller.create);
router.put('/:id', auth.isAuthenticated(), controller.update);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/dashboard/me', auth.isAuthenticated(), controller.myTask);
router.get('/:id', auth.isAuthenticated(), controller.get);
router.get('/:id/project-tasks', auth.isAuthenticated(), controller.getTasksByProject);

module.exports = router;
