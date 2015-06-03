'use strict';

var express = require('express');
var controller = require('./contractors.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

//router.get('/', auth.isAuthenticated(), controller.index);
router.get('/', controller.index);
//router.delete('/:id', auth.hasRole('admin'), controller.destroy);
//router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/', controller.createContractorPackage);

module.exports = router;
