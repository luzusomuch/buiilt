'use strict';

var express = require('express');
var controller = require('./upload.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/:id', auth.isAuthenticated(), controller.upload);
router.post('/:id/upload-mobile', auth.isAuthenticated(), controller.uploadMobile);
router.post('/:id/file-package', auth.isAuthenticated(), controller.uploadInPackge);
router.post('/:id/file-in-people', auth.isAuthenticated(), controller.uploadInPeople);
router.post('/:id/file-in-board', auth.isAuthenticated(), controller.uploadInBoard);

module.exports = router;
