'use strict';

var express = require('express');
var controller = require('./quoteRequest.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();
router.post('/', auth.isAuthenticated(), controller.create);
router.get('/:id', controller.show);
router.put('/:id', controller.selectQuote);

module.exports = router;