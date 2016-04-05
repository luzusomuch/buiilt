'use strict';

var express = require('express');
var controller = require('./contractors.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

//router.get('/', auth.isAuthenticated(), controller.index);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

router.post('/', auth.isAuthenticated(), controller.createContractorPackage);

router.get('/list', auth.isAuthenticated(), controller.getAll);
router.get('/:id',  auth.isAuthenticated(), controller.index);
router.get('/:id/winner', auth.isAuthenticated(), controller.getProjectForContractor);
router.get('/:id/projectb', auth.isAuthenticated(), controller.getContractorPackageByProjectForBuilder);
router.get('/:id/project-contractor', auth.isAuthenticated(), controller.getContractorPackageByProjectForContractor);
router.get('/:id/tenderbuilder', auth.isAuthenticated(), controller.getContractorPackageTenderByProjectForBuilder);
router.get('/:id/processingbuilder', auth.isAuthenticated(), controller.getContractorPackageInProcessByProjectForBuilder);
router.get('/:id/tendercontractor', auth.isAuthenticated(), controller.getContractorPackageTenderByProjectForContractor);
router.get('/:id/processingcontractor', auth.isAuthenticated(), controller.getContractorPackageInProcessByProjectForContractor);

router.put('/:id', auth.isAuthenticated(), controller.updatePackage);
module.exports = router;
