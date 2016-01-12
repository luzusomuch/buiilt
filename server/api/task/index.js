'use strict';

var express = require('express');
var controller = require('./task.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post("/:id", auth.isAuthenticated(), controller.create);
// router.post('/:id/:type', auth.isAuthenticated(), controller.package, controller.create);
router.put('/:id', auth.isAuthenticated(), controller.update);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/list', auth.isAuthenticated(), controller.getAll);
router.get('/list-by-user', auth.isAuthenticated(), controller.getAllByUser);
router.get('/dashboard/me', auth.isAuthenticated(), controller.myTask);
router.get('/:id', auth.isAuthenticated(), controller.get);
router.get('/:id/project-tasks', auth.isAuthenticated(), controller.getTasksByProject);
router.get('/:id/:type', auth.isAuthenticated(), controller.package, controller.getTask);
router.get('/:id/:type/get-by-package', auth.isAuthenticated(), controller.getByPackage);
router.get('/:id/:type/get-one', auth.isAuthenticated(), controller.show);

module.exports = router;
