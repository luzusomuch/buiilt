'use strict';

var express = require('express');
var controller = require('./people.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.put('/:id', auth.isAuthenticated(), controller.invitePeople);

module.exports = router;
