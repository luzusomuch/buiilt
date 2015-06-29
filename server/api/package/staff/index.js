'use strict';

var express = require('express');
var controller = require('./staff.controller');
var auth = require('../../../auth/auth.service');

var router = express.Router();
router.get('/:id/list', auth.isAuthenticated(), controller.project, controller.getAll);
router.get('/:id/get', auth.isAuthenticated(), controller.staffPackage, controller.getOne);
//router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/:id', auth.isAuthenticated(), controller.project, controller.create);
router.put('/:id/complete', auth.isAuthenticated(), controller.staffPackage, controller.complete);
module.exports = router;