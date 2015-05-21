'use strict';

var express = require('express');
var controller = require('./project.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/', auth.isAuthenticated(), controller.create);
// router.get('/', controller.index);
router.get('/:id', auth.isAuthenticated(), controller.show);
// router.post('/', controller.create);

module.exports = router;
