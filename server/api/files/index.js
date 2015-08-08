'use strict';

var express = require('express');
var controller = require('./files.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

// router.post('/', auth.isAuthenticated(), controller.create);
router.get('/get-all', auth.isAuthenticated(), controller.getAll);
router.get('/:id/document', auth.isAuthenticated(), controller.getByDocument);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.get('/:id/contractor-package', auth.isAuthenticated(), controller.getFileByContractorPackage);
// router.put('/:id', auth.isAuthenticated(), controller.update);
router.put('/:id/interested', auth.isAuthenticated(), controller.interested);
// router.put('/:id/disinterested', auth.isAuthenticated(), controller.disinterested);
router.get('/:id/params', auth.isAuthenticated(), controller.getFileByStateParam);
router.get('/:id/download', auth.isAuthenticated(), controller.downloadFile);
router.get('/:id/download-all', auth.isAuthenticated(), controller.downloadAll);
// router.get('/me', auth.isAuthenticated(), controller.getMyFile);
// router.post('/', controller.create);

module.exports = router;
