'use strict';

var express = require('express');
var controller = require('./files.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

// router.post('/', auth.isAuthenticated(), controller.create);
router.get('/get-all', auth.isAuthenticated(), controller.getAll);
router.get('/get-all-by-user', auth.isAuthenticated(), controller.getAllByUser);
router.get('/:id/document', auth.isAuthenticated(), controller.getByDocument);
router.get('/:id', auth.isAuthenticated(), controller.show);
// router.put('/:id', auth.isAuthenticated(), controller.update);
router.put('/:id/interested', auth.isAuthenticated(), controller.interested);
// router.put('/:id/disinterested', auth.isAuthenticated(), controller.disinterested);
router.get('/:id/params', auth.isAuthenticated(), controller.getFileByStateParam);
router.get('/:id/params-ios', auth.isAuthenticated(), controller.getFileByStateParamIos);
router.get('/:id/download', auth.isAuthenticated(), controller.downloadFile);
router.get('/:id/download-all', auth.isAuthenticated(), controller.downloadAll);
router.get('/:id/:type/get-by-package', auth.isAuthenticated(), controller.getFileByPackage);
router.delete('/:id', auth.isAuthenticated(), controller.deleteFile);
// router.get('/me', auth.isAuthenticated(), controller.getMyFile);
router.post('/:id/send-to-document', auth.isAuthenticated(), controller.sendToDocument);

module.exports = router;
