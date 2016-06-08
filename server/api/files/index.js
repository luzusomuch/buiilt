'use strict';

var express = require('express');
var controller = require('./files.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post("/:id", auth.isAuthenticated(), controller.create);
router.get('/my-files', auth.isAuthenticated(), controller.myFiles);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.get('/:id/acknowledgement', auth.isAuthenticated(), controller.acknowledgement);
router.get('/:id/get-public-s3-link', auth.isAuthenticated(), controller.getPublicS3Link);
router.get('/:id/last-access', auth.isAuthenticated(), controller.lastAccess);
router.get('/:id/:type/project-files', auth.isAuthenticated(), controller.getFilesByProject);
router.put("/:id", auth.isAuthenticated(), controller.update);
router.put('/:id/assign-more-members', auth.isAuthenticated(), controller.assignMoreMembers);
router.delete('/:id', auth.isAuthenticated(), controller.deleteFile);

module.exports = router;
