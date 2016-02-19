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
    } else if (file.element.type === "document") {
        var roles = ["builders", "clients", "architects", "subcontractors", "consultants"];
        People.findOne({project: file.project}, function(err, people) {
            if (err || !people)
                return next();
            else {
                async.each(roles, function(role, cb) {
                    async.each(people[role], function(tender, callback) {
                        if (tender.hasSelect && tender.tenderers[0]._id && tender.tenderers[0]._id.toString()!==file.owner.toString()) {
                            var params = {
                                owners : [tender.tenderers[0]._id],
                                fromUser : file.owner,
                                element : file,
                                referenceTo : 'document',
                                type : 'document-assign'
                            };
                            NotificationHelper.create(params, callback);
                        } else 
                            callback();
                    }, cb);
                }, function(){
                    return next();
                });
            }
        });
    } else {
        return next();
    }
});

EventBus.onSeries('File.Updated', function(file, next) {
    if (file.editType === "uploadReversion") {
        if (file.element.type === "document") {
            var roles = ["builders", "clients", "architects", "subcontractors", "consultants"];
            People.findOne({project: file.project}, function(err, people) {
                if (err || !people)
                    return next();
                else {
                    async.each(roles, function(role, cb) {
                        async.each(people[role], function(tender, callback) {
                            if (tender.hasSelect && tender.tenderers[0]._id && tender.tenderers[0]._id.toString()!==file.owner.toString()) {
                                var params = {
                                    owners : [tender.tenderers[0]._id],
                                    fromUser : file.owner,
                                    element : file,
                                    referenceTo : 'document',
                                    type : 'document-upload-reversion'
                                };
                                NotificationHelper.create(params, callback);
                            } else 
                                callback();
                        }, cb);
                    }, function(){
                        return next();
                    });
                }
            });
        } else if (file.element.type === "file" || file.element.type === "tender") {
            if (file.members.length > 0) {
                var params = {
                    owners : file.members,
                    fromUser : file.owner,
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
    } else {
        return next();
    }
});