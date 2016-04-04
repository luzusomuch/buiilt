'use strict';

var express = require('express');
var controller = require('./quote.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

// router.post('/', auth.isAuthenticated(), controller.create);
router.get('/', auth.isAuthenticated(), controller.index);
router.get('/:id', auth.isAuthenticated(), controller.findOne);
router.get('/:id/material', auth.isAuthenticated(), controller.getByMaterial);
router.get('/:id/project', auth.isAuthenticated(), controller.getByProjectId);
router.put('/:id/select-contractor-winner-by-quote-document', auth.isAuthenticated(), controller.selectContractorQuoteByDocument);
router.put('/:id/select-supplier-winner-by-quote-document', auth.isAuthenticated(), controller.selectMaterialQuoteByDocument);
router.post('/', controller.createUserForHomeBuilderRequest);
router.post('/:id', auth.isAuthenticated(), controller.create);
// router.post('/', controller.create);

module.exports = router;
