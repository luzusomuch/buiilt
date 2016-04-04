'use strict';

var express = require('express');
var controller = require('./notification.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();
router.get('/', auth.isAuthenticated(), controller.get);
router.get('/get-total', auth.isAuthenticated(), controller.countTotal);
router.get('/get-total-ios', auth.isAuthenticated(), controller.countTotalForIOS);
router.put('/:id/mark-as-read', auth.isAuthenticated(),controller.notification, controller.update);
router.put('/mark-all-as-read', auth.isAuthenticated(), controller.allRead);
router.get("/:id/mark-items-as-read", auth.isAuthenticated(), controller.markItemsAsRead);
module.exports = router;