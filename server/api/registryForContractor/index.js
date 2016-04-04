'use strict';

var express = require('express');
var controller = require('./registryForContractor.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/', controller.createUserForContractorRequest);

module.exports = router;
