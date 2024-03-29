'use strict';

var express = require('express');
var controller = require('./builder.controller');
var auth = require('../../../auth/auth.service');

var router = express.Router();
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/list', auth.isAuthenticated(), controller.getAll);
router.get('/:id', auth.isAuthenticated(), controller.project, controller.getDefaultPackageByProject);
router.get('/:id/find-by-project', auth.isAuthenticated(), controller.findByProject);
router.put('/:id', auth.isAuthenticated(), controller.updatePackage);
router.put('/:id/decline-quote', auth.isAuthenticated(), controller.declineQuote);
router.put('/:id/select-winner', auth.isAuthenticated(), controller.selectWinner);
router.post('/:id/invite-builder', auth.isAuthenticated(), controller.inviteBuilder);
router.post('/:id/send-message', auth.isAuthenticated(), controller.sendMessage);
router.post('/:id/send-message-to-architect', auth.isAuthenticated(), controller.sendMessageToArchitect);
module.exports = router;