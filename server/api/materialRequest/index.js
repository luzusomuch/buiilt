'use strict';

var express = require('express');
var controller = require('./materialRequest.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

//router.get('/', auth.isAuthenticated(), controller.index);
// router.get('/', controller.index);
//router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/:id', controller.findOne);
router.post('/', auth.isAuthenticated(), controller.sendQuote);
router.get('/:id/view', auth.isAuthenticated(), controller.getQuoteRequestByMaterialPackge);

module.exports = router;
