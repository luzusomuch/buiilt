'use strict';

var express = require('express');
var controller = require('./contractorRequest.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

//router.get('/', auth.isAuthenticated(), controller.index);
// router.get('/', controller.index);
//router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/:id', auth.isAuthenticated(), controller.findOne);
router.post('/', auth.isAuthenticated(), controller.sendQuote);
router.get('/:id/view', auth.isAuthenticated(), controller.getQuoteRequestByContractorPackge);

module.exports = router;
