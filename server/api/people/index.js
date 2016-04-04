'use strict';

var express = require('express');
var controller = require('./people.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.put('/:id/invite', auth.isAuthenticated(), controller.invitePeople);
router.put('/:id/select-winner-tender', auth.isAuthenticated(), controller.selectWinnerTender);
router.put('/:id/:tenderId/update-tender', auth.isAuthenticated(), controller.updateTender);
router.put('/:id/:tenderId/create-related-item', auth.isAuthenticated(), controller.createRelatedItem);
router.get('/:id/get-invite-people', auth.isAuthenticated(), controller.getInvitePeople);
router.get('/:id/:tenderId/get-tender', auth.isAuthenticated(), controller.getTender);
router.get('/:id/:tenderId/update-distribute-status', auth.isAuthenticated(), controller.updateDistributeStatus);
router.get('/:id/:tenderId/acknowledgement', auth.isAuthenticated(), controller.acknowledgement);
router.get('/:id/:type/:tenderId/:activityId/:email/download-via-email', controller.acknowledgementViaEmail);

router.post("/:id/submit-a-tender", auth.isAuthenticated(), controller.submitATender);
router.post("/:id/:tenderId/attach-addendum", auth.isAuthenticated(), controller.attachAddendum);
module.exports = router;
