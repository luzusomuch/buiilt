'use strict';

var express = require('express');
var controller = require('./team-invite.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/projects-invitation', auth.isAuthenticated(), controller.getProjectInvitation);
router.get('/:token', controller.get);

module.exports = router;
