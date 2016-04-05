'use strict';

var express = require('express');
var controller = require('./device.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/', auth.isAuthenticated(), controller.insertDevice);
router.get('/:id/remove-device', auth.isAuthenticated(), controller.removeDevice);

module.exports = router;