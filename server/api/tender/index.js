'use strict';

var express = require('express');
var controller = require('./tender.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post("/", auth.isAuthenticated(), controller.create);
router.post("/:id/upload-tender-document", auth.isAuthenticated(), controller.uploadTenderDocument);

router.put("/:id", auth.isAuthenticated(), controller.update);
router.put("/:id/:activityId/acknowledgement", auth.isAuthenticated(), controller.acknowledgement);
router.put("/:id/:activityId/update-tender-invitee", auth.isAuthenticated(), controller.updateTenderInvitee);

router.get("/get-all", auth.isAuthenticated(), controller.getAll);
router.get("/:id", auth.isAuthenticated(), controller.get);

module.exports = router;