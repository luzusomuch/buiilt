'use strict';

var express = require('express');
var controller = require('./staff.controller');
var auth = require('../../../auth/auth.service');

var router = express.Router();
//router.get('/default', auth.isAuthenticated(), controller.getDefaultPackagePackageByProject);
//router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/:id', auth.isAuthenticated(),controller.project, controller.create);
module.exports = router;