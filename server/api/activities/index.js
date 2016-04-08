'use strict';

var express = require('express');
var controller = require('./activity.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get("/:id/me", auth.isAuthenticated(), controller.me);//get all activity or milestone of project for current user

router.post('/:id', auth.isAuthenticated(), controller.create); //create new activity or mileston depend on project

module.exports = router;