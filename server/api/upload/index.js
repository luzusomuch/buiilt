'use strict';

var express = require('express');
var controller = require('./upload.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/:id', auth.isAuthenticated(), controller.upload);
router.post('/:id/upload-reversion', auth.isAuthenticated(), controller.uploadReversion);
router.post('/:id/upload-mobile', auth.isAuthenticated(), controller.uploadMobile);

module.exports = router;
