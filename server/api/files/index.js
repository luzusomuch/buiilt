'use strict';

var express = require('express');
var controller = require('./files.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/get-all', auth.isAuthenticated(), controller.getAll);
router.get('/get-all-by-user', auth.isAuthenticated(), controller.getAllByUser);
router.get('/my-files', auth.isAuthenticated(), controller.myFiles);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.get('/:id/acknowledgement', auth.isAuthenticated(), controller.acknowledgement);
router.get('/:id/params', auth.isAuthenticated(), controller.getFileByStateParam);
router.get('/:id/params-ios', auth.isAuthenticated(), controller.getFileByStateParamIos);
router.get('/:id/download', auth.isAuthenticated(), controller.downloadFile);
router.get('/:id/download-all', auth.isAuthenticated(), controller.downloadAll);
router.get('/:id/get-in-people', auth.isAuthenticated(), controller.getInPeople);
router.get('/:id/get-in-board', auth.isAuthenticated(), controller.getInBoard);
router.get('/:id/get-in-project', auth.isAuthenticated(), controller.getInProject);
router.get('/:id/:type/project-files', auth.isAuthenticated(), controller.getFilesByProject);
router.get('/:id/:type/get-by-package', auth.isAuthenticated(), controller.getFileByPackage);

router.get("/:id/:type/download-via-email", controller.acknowledgementViaEmail);

router.put("/:id", auth.isAuthenticated(), controller.update);
router.put('/:id/interested', auth.isAuthenticated(), controller.interested);
router.delete('/:id', auth.isAuthenticated(), controller.deleteFile);
router.post('/:id/send-to-document', auth.isAuthenticated(), controller.sendToDocument);

module.exports = router;
