'use strict';

var express = require('express');
var controller = require('./team.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/', auth.isAuthenticated(), controller.create);
router.get('/', auth.isAuthenticated(), controller.index);
router.get('/all', auth.isAuthenticated(), controller.getAll);
router.get('/me', auth.isAuthenticated(), controller.me);
router.get('/invitation', auth.isAuthenticated(), controller.invitation);
router.get('/is-waiting-team-accept', auth.isAuthenticated(), controller.isWaitingTeamAccept);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.get('/:id/send-join-team-request', auth.isAuthenticated(), controller.sendJoinTeamRequest);
router.get('/:id/accept-join-request', auth.isAuthenticated(), controller.acceptJoinRequest);
router.post('/:id/add-member',auth.isAuthenticated(), controller.team, controller.addMember);
router.post('/:id/remove-member',auth.isAuthenticated(), controller.team, controller.removeMember);
router.put('/:id', auth.isAuthenticated(),controller.team, controller.update);
router.put('/:id/accept', auth.isAuthenticated(), controller.team, controller.accept);
router.put('/:id/reject', auth.isAuthenticated(), controller.team, controller.reject);
router.put('/:id/assign-leader', auth.isAuthenticated(), controller.team, controller.assignLeader);
router.put('/:id/leave-team', auth.isAuthenticated(), controller.team, controller.leaveTeam);
router.get('/:id/user', auth.isAuthenticated(), controller.getTeamByUser);

module.exports = router;
