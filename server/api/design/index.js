'use strict';

var express = require('express');
var controller = require('./design.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.delete('/:id', auth.hasRole('admin'), controller.destroy);

router.post('/:id', auth.isAuthenticated(), controller.createDesign);

router.get('/:id',  auth.isAuthenticated(), controller.get);
router.get('/:id/list', auth.isAuthenticated(), controller.getAll);

router.put('/:id', auth.isAuthenticated(), controller.updateDesign);
module.exports = router;
