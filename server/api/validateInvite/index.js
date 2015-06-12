'use strict';

var express = require('express');
var controller = require('./validateInvite.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/',auth.isAuthenticated(), controller.getByUser);

module.exports = router;
