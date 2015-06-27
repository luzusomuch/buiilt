'use strict';

var express = require('express');
var controller = require('./addOnPackage.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/:id/send-defect', auth.isAuthenticated(), controller.sendDefect);
router.post('/:id/send-addendum', auth.isAuthenticated(), controller.sendAddendum);
router.post('/:id/send-invoice', auth.isAuthenticated(), controller.sendInvoice);
router.post('/:id/send-variation', auth.isAuthenticated(), controller.sendVariation);
router.put('/:id/remove-addendum', auth.isAuthenticated(), controller.removeAddendum);

module.exports = router;
