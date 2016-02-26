'use strict';

var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var Project = require('./../models/project.model');
var People = require('./../models/people.model');
var NotificationHelper = require('./../components/helpers/notification');
var _ = require('lodash');
var async = require('async');


EventBus.onSeries('File.Inserted', function(file, next) {
    if (file.element.type === "file") {
        if (file.members.length > 0) {
            var params = {
                owners : file.members,
                fromUser : file.owner,
                element : file,
                referenceTo : 'file',
                type : 'file-assign'
            };
            NotificationHelper.create(params, function() {
                return next();
            });
        } else
            return next();
    } else {
        return next();
    }
});

EventBus.onSeries('File.Updated', function(file, next) {
    if (file.editType === "uploadReversion") {
        if (file.element.type === "document") {
            var latestHistory = _.last(file.fileHistory);
            async.each(latestHistory.members, function(member, callback) {
                if (member._id) {
                    var params = {
                        owners : [member._id],
                        fromUser : file.editUser._id,
                        element : file,
                        referenceTo : 'document',
                        type : 'document-upload-reversion'
                    };
                    NotificationHelper.create(params, callback);
                } else {
                    callback();
                }
            }, function() {
                return next();
            });
        } else if (file.element.type === "file" || file.element.type === "tender") {
            if (file.members.length > 0) {
                var params = {
                    owners : file.members,
                    fromUser : file.editUser._id,
                    element : file,
                    referenceTo : file.element.type,
                    type : file.element.type+'-upload-reversion'
                };
                NotificationHelper.create(params, function() {
                    return next();
                });
            } else
                return next();
        } else {
            return next();
        }
    } else if (file.editType==="sendAcknowledge") {
        if (file.element.type==="file" || file.element.type==="tender") {
            if (file.members.length > 0) {
                _.remove(file.members, file.editUser._id);
                var params = {
                    owners : file.members,
                    fromUser : file.editUser._id,
                    element : file,
                    referenceTo : file.element.type,
                    type : file.element.type+'-send-acknowledge'
                };
                NotificationHelper.create(params, function() {
                    return next();
                });
            } else
                return next();
        } else if (file.element.type==="document") {
            var params = {
                owners : [file.owner],
                fromUser : file.editUser._id,
                element : file,
                referenceTo : 'document',
                type : 'document-send-acknowledge'
            };
            NotificationHelper.create(params, function() {
                return next();
            });
        } else {
            return next();
        }
    } else {
        return next();
    }
});