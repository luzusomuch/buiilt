'use strict';

var express = require('express');
var controller = require('./people.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.put('/:id/invite', auth.isAuthenticated(), controller.invitePeople);
router.get('/:id/get-invite-people', auth.isAuthenticated(), controller.getInvitePeople);
module.exports = router;
