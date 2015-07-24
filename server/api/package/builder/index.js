'use strict';

var express = require('express');
var controller = require('./builder.controller');
var auth = require('../../../auth/auth.service');

var router = express.Router();
router.get('/:id', auth.isAuthenticated(), controller.project, controller.getDefaultPackageByProject);
router.get('/:id/find-by-project', auth.isAuthenticated(), controller.findByProject);

module.exports = router;