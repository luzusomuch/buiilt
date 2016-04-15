'use strict';

var express = require('express');
var controller = require('./contactBook.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get("/me", auth.isAuthenticated(), controller.me);//get all activity or milestone of project for current user

router.post('/', auth.isAuthenticated(), controller.create); //create new activity or mileston depend on project
module.exports = router;