'use strict';

var express = require('express');
var controller = require('./packageInvite.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

//router.get('/', auth.isAuthenticated(), controller.index);
// router.get('/', controller.index);
//router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/:id/package-invite-token', controller.getByPackageInviteToken);

module.exports = router;
