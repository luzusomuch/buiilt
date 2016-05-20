'use strict';

var express = require('express');
var controller = require('./document.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get("/:id", auth.isAuthenticated(), controller.get);//get document set by id
router.get("/:id/me", auth.isAuthenticated(), controller.me);//get all set documents of project for current user

router.post('/:id', auth.isAuthenticated(), controller.create); //create new set of document on project

router.put('/:id', auth.isAuthenticated(), controller.update); //update a set document on project

module.exports = router;