'use strict';

var express = require('express');
var controller = require('./document.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

// router.post('/', auth.isAuthenticated(), controller.create);
router.get('/', auth.isAuthenticated(), controller.index);
// router.get('/:id', auth.isAuthenticated(), controller.show);
// router.put('/:id', auth.isAuthenticated(), controller.update);
// router.put('/:id/winner', auth.isAuthenticated(), controller.selectWinner);
// router.post('/', controller.create);

module.exports = router;
