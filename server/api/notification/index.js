'use strict';

var express = require('express');
var controller = require('./notification.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();
router.get('/', auth.isAuthenticated(), controller.get);
router.get('/me', auth.isAuthenticated(), controller.getMyFile);
router.put('/:id/mark-as-read', auth.isAuthenticated(),controller.notification, controller.update);
router.put('/mark-all-as-read', auth.isAuthenticated(), controller.allRead);
//router.get('/:id/get', auth.isAuthenticated(), controller.staffPackage, controller.getOne);
////router.get('/:id', auth.isAuthenticated(), controller.show);
//router.post('/:id', auth.isAuthenticated(), controller.project, controller.create);
module.exports = router;