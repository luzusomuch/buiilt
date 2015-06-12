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
router.get('/:id/project', auth.isAuthenticated(), controller.getContractorByProject);
router.get('/:id/tender', auth.isAuthenticated(), controller.getContractorPackageTenderByProject);
router.get('/:id/processing', auth.isAuthenticated(), controller.getContractorPackageInProcessByProject);

module.exports = router;
