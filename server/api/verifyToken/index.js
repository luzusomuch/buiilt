'use strict';

var express = require('express');
var controller = require('./verifyToken.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', controller.get);

router.post("/", controller.create);

module.exports = router;
