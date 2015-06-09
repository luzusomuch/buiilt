'use strict';

var express = require('express');
var controller = require('./material.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/', auth.isAuthenticated(), controller.createMaterialPackage);

module.exports = router;
