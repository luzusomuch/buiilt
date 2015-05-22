'use strict';

var express = require('express');
var controller = require('./quote.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

// router.post('/', auth.isAuthenticated(), controller.create);
// router.get('/', controller.index);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/:id', auth.isAuthenticated(), controller.create);
// router.post('/', controller.create);

module.exports = router;
