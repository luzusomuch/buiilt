'use strict';

var express = require('express');
var controller = require('./upload.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

// router.post('/', auth.isAuthenticated(), controller.create);
// router.get('/', auth.isAuthenticated(), controller.index);
// router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/:id/file', auth.isAuthenticated(), controller.upload);
// router.get('/:id/project', auth.isAuthenticated(), controller.getByProjectId)
// router.post('/', controller.create);

module.exports = router;
