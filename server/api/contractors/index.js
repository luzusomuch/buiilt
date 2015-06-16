'use strict';

var express = require('express');
var controller = require('./contractors.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

//router.get('/', auth.isAuthenticated(), controller.index);
router.get('/', controller.index);
//router.delete('/:id', auth.hasRole('admin'), controller.destroy);
//router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/', auth.isAuthenticated(), controller.createContractorPackage);
router.get('/:id/winner', auth.isAuthenticated(), controller.getProjectForContractorWhoWinner);

//get contractor package by project for builder
router.get('/:id/projectb', auth.isAuthenticated(), controller.getContractorByProjectForBuilder);
router.get('/:id/tenderbuilder', auth.isAuthenticated(), controller.getContractorPackageTenderByProjectForBuilder);
router.get('/:id/processingbuilder', auth.isAuthenticated(), controller.getContractorPackageInProcessByProjectForBuilder);

//get contractor package by project for contractor
router.get('/:id/tendercontractor', auth.isAuthenticated(), controller.getContractorPackageTenderByProjectForContractor);
router.get('/:id/processingcontractor', auth.isAuthenticated(), controller.getContractorPackageInProcessByProjectForContractor);

module.exports = router;
