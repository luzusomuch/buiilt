'use strict';

var express = require('express');
var controller = require('./contractorRequest.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

//router.get('/', auth.isAuthenticated(), controller.index);
// router.get('/', controller.index);
//router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/:id', controller.findOne);
router.post('/', auth.isAuthenticated(), controller.sendQuote);
router.post('/:id/invite', auth.isAuthenticated(), controller.sendInvitationInContractor);
router.post('/:id/message', auth.isAuthenticated(), controller.sendMessage);
router.post('/:id/send-message-to-builder', auth.isAuthenticated(), controller.sendMessageToBuilder);
router.get('/:id/message-builder', auth.isAuthenticated(), controller.getMessageForBuilder);
router.get('/:id/message-contractor', auth.isAuthenticated(), controller.getMessageForContractor);
router.post('/:id/sendVariation', auth.isAuthenticated(), controller.sendVariation);
router.post('/:id/sendDefect', auth.isAuthenticated(), controller.sendDefect);
router.post('/:id/sendInvoice', auth.isAuthenticated(), controller.sendInvoice);
router.post('/:id/send-addendum', auth.isAuthenticated(), controller.sendAddendum);
router.put('/:id/cancel-package', auth.isAuthenticated(), controller.cancelPackage);
router.put('/:id/complete', auth.isAuthenticated(), controller.contractorPackage, controller.complete);
// router.get('/:id/getVariation', auth.isAuthenticated(), controller.getVariation);
router.get('/:id/view', auth.isAuthenticated(), controller.getQuoteRequestByContractorPackge);

module.exports = router;
