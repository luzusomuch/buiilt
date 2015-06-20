'use strict';

var express = require('express');
var controller = require('./material.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/', auth.isAuthenticated(), controller.createMaterialPackage);
router.get('/:id/supplier', auth.isAuthenticated(), controller.getProjectForSupplier);
router.get('/:id/projectb', auth.isAuthenticated(), controller.getMaterialByProjectForBuilder);
router.get('/:id/project-supplier', auth.isAuthenticated(), controller.getMaterialByProjectForSupplier);
router.get('/:id/tender-builder', auth.isAuthenticated(), controller.getMaterialPackageTenderByProjectForBuilder);
router.get('/:id/processing-builder', auth.isAuthenticated(), controller.getMaterialPackageInProcessByProjectForBuilder);
router.get('/:id/tender-supplier', auth.isAuthenticated(), controller.getMaterialPackageInTenderByProjectForSupplier);
router.get('/:id/processing-supplier', auth.isAuthenticated(), controller.getMaterialPackageInProcessByProjectForSupplier);

module.exports = router;
