'use strict';

var express = require('express');
var controller = require('./project.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/', auth.isAuthenticated(), controller.create);
router.post('/change-project-limit', auth.hasRole("admin"), controller.changeLimitedProjectNumber);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/get-project-limit', auth.hasRole("admin"), controller.getLimitedProjectNumber);
router.get('/list', auth.isAuthenticated(), controller.getAll);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.get('/:id/backup', auth.isAuthenticated(), controller.backup);
router.put('/:id', auth.isAuthenticated(), controller.updateProject);

module.exports = router;
