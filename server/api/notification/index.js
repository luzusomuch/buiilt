'use strict';

var express = require('express');
var controller = require('./notification.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();
router.get('/', auth.isAuthenticated(), controller.get);
router.get('/get-total', auth.isAuthenticated(), controller.countTotal);
router.get('/get-total-ios', auth.isAuthenticated(), controller.countTotalForIOS);
router.get('/:id/get-one', auth.isAuthenticated(), controller.getOne);
router.get('/:id/my-file', auth.isAuthenticated(), controller.getMyFile);
router.put('/:id/mark-as-read', auth.isAuthenticated(),controller.notification, controller.update);
router.put('/:id/dashboard-read', auth.isAuthenticated(), controller.dashboardRead);
router.put('/:id/dashboard-read-document', auth.isAuthenticated(), controller.dashboardReadDocument);
router.put('/mark-all-as-read', auth.isAuthenticated(), controller.allRead);
router.put('/:id/mark-read-by-package', auth.isAuthenticated(), controller.markReadByPackage);
//router.get('/:id/get', auth.isAuthenticated(), controller.staffPackage, controller.getOne);
////router.get('/:id', auth.isAuthenticated(), controller.show);
//router.post('/:id', auth.isAuthenticated(), controller.project, controller.create);
module.exports = router;