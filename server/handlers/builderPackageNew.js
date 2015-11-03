'use strict';

var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var Project = require('./../models/project.model');
var BuilderPackageNewVersion = require('./../models/builderPackageNew.model');
var Notification = require('./../models/notification.model');
var NotificationHelper = require('./../components/helpers/notification');
var PushNotificationHelper = require('./../components/helpers/PushNotification');
var _ = require('lodash');
var async = require('async');

EventBus.onSeries('BuilderPackageNewVersion.Inserted', function(builderPackage, next) {
    if (builderPackage.projectManager._id && builderPackage.projectManager._id != builderPackage.editUser._id) {
        var owners = [builderPackage.projectManager._id];
        PushNotificationHelper.getData(builderPackage.project, builderPackage._id, builderPackage.name, 'invite you to a new project', owners, 'project');
    } else {
        return next();
    }
});