'use strict';

var express = require('express');
var controller = require('./user.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/me', auth.isAuthenticated(), controller.me);
router.get('/all', auth.isAuthenticated(), controller.all);
router.get('/send-verification-test', auth.isAuthenticated(), controller.sendVerificationTest);
router.put('/:id/password', auth.isAuthenticated(), controller.changePassword);
router.put('/:id/email', auth.isAuthenticated(), controller.changeEmail);
// router.put('/:id/phone', auth.isAuthenticated(), controller.changePhoneNum);
router.put('/:id/change-profile', auth.isAuthenticated(), controller.changeProfile);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/', controller.create);
router.post('/invite-token', controller.createUserWithInviteToken);
router.post('/send-verification', auth.isAuthenticated(), controller.sendVerification);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);
router.get('/:id/reset-password', controller.getResetPasswordToken);

module.exports = router;
