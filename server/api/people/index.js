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

router.post("/:id/:tenderId/attach-addendum", auth.isAuthenticated(), controller.attachAddendum);
module.exports = router;
