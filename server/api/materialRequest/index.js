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
router.post('/:id/invite', auth.isAuthenticated(), controller.sendInvitationInMaterial);
router.post('/:id/message', auth.isAuthenticated(), controller.sendMessage);
router.get('/:id/message-supplier', auth.isAuthenticated(), controller.getMessageForSupplier);
router.post('/:id/sendDefect', auth.isAuthenticated(), controller.sendDefect);
router.post('/:id/sendInvoice', auth.isAuthenticated(), controller.sendInvoice);
router.post('/:id/send-addendum', auth.isAuthenticated(), controller.sendAddendum);

module.exports = router;
