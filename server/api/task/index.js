'use strict';

var express = require('express');
var controller = require('./task.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/:id/:type', auth.isAuthenticated(), controller.package, controller.create);
router.put('/:id/:type', auth.isAuthenticated(), controller.task, controller.update);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/list', auth.isAuthenticated(), controller.getAll);
router.get('/list-by-user', auth.isAuthenticated(), controller.getAllByUser);
router.get('/:id', auth.isAuthenticated(), controller.getOne);
router.get('/:id/list-by-project', auth.isAuthenticated(), controller.getAllByProject);
router.get('/:id/:type', auth.isAuthenticated(), controller.package, controller.getTask);
router.get('/:id/:type/get-by-package', auth.isAuthenticated(), controller.getByPackage);
router.get('/:id/:type/get-one', auth.isAuthenticated(), controller.show);
router.get('/:id/dashboard/me', auth.isAuthenticated(),controller.project, controller.myTask);

module.exports = router;
