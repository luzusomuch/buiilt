'use strict';

var express = require('express');
var controller = require('./user.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.delete('/:id', auth.hasRole('admin'), controller.destroy);

router.get('/all', auth.hasRole('admin'), controller.index);
router.get('/me', auth.isAuthenticated(), controller.me);
router.get('/get-current-stripe-customer', auth.isAuthenticated(), controller.getCurrentStripeCustomer);
router.get("/:id/profile", controller.getUserProfile);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.get('/:id/reset-password', controller.getResetPasswordToken);

router.post('/', controller.create);
router.post('/invite-token', controller.createUserWithInviteToken);
router.post('/send-verification', auth.isAuthenticated(), controller.sendVerification);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);
router.post('/buy-plan', auth.isAuthenticated(), controller.buyPlan);

router.put('/:id/password', auth.isAuthenticated(), controller.changePassword);
router.put('/:id/email', auth.isAuthenticated(), controller.changeEmail);
router.put('/:id/change-profile', auth.isAuthenticated(), controller.changeProfile);
router.put('/:id/admin-update', auth.hasRole('admin'), controller.adminUpdateUserProfile);

module.exports = router;
