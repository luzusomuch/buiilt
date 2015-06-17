'use strict';

var express = require('express');
var controller = require('./files.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

// router.post('/', auth.isAuthenticated(), controller.create);
router.get('/:id/document', auth.isAuthenticated(), controller.getByDocument);
router.get('/:id', auth.isAuthenticated(), controller.show);
// router.put('/:id', auth.isAuthenticated(), controller.update);
router.put('/:id/interested', auth.isAuthenticated(), controller.interested);
router.get('/:id/params', auth.isAuthenticated(), controller.getFileByStateParam);
// router.post('/', controller.create);

module.exports = router;
