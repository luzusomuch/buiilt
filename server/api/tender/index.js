'use strict';

var express = require('express');
var controller = require('./tender.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post("/", auth.isAuthenticated(), controller.create);

router.get("/get-all", auth.isAuthenticated(), controller.getAll);
router.get("/:id", auth.isAuthenticated(), controller.get);

module.exports = router;