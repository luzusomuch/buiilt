'use strict';

var express = require('express');
var controller = require('./project.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/', auth.isAuthenticated(), controller.create);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/', auth.isAuthenticated(), controller.index);
// router.get('/:id', auth.isAuthenticated(), controller.show);
router.get('/list', auth.isAuthenticated(), controller.getAll);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.put('/:id/winner', auth.isAuthenticated(), controller.selectWinner);
router.get('/:id/user', auth.isAuthenticated(), controller.getProjectsByUser);
router.get('/:id/builder', auth.isAuthenticated(), controller.getProjectsByBuilder);

router.put('/:id', auth.isAuthenticated(), controller.updateProject);
// router.post('/', controller.create);

module.exports = router;
