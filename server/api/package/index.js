'use strict';

var express = require('express');
var controller = require('./package.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/:id/project', auth.isAuthenticated(), controller.getPackageByProject);


module.exports = router;
