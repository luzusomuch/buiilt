'use strict';

var express = require('express');
var controller = require('./design.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

//router.get('/', auth.isAuthenticated(), controller.index);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);

router.post('/', auth.isAuthenticated(), controller.createDesign);

router.get('/list', auth.isAuthenticated(), controller.getAll);
router.get('/:id',  auth.isAuthenticated(), controller.get);

router.put('/:id', auth.isAuthenticated(), controller.updateDesign);
module.exports = router;
