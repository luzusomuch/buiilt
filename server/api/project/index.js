'use strict';

var express = require('express');
var controller = require('./project.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/', auth.isAuthenticated(), controller.create);
router.get('/', auth.isAuthenticated(), controller.index);
// router.get('/:id', auth.isAuthenticated(), controller.show);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.put('/:id/winner', auth.isAuthenticated(), controller.selectWinner);
router.get('/:id/user', auth.isAuthenticated(), controller.getProjectsByUser);
router.get('/:id/builder', auth.isAuthenticated(), controller.getProjectsByBuilder);
router.get('/all-projects', auth.isAuthenticated(), controller.getAllProjects);
// router.post('/', controller.create);

module.exports = router;
