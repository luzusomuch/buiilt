'use strict';

var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var Project = require('./../models/project.model');
var Document = require('./../models/document.model');
var People = require('./../models/people.model');
var Notification = require('./../models/notification.model');
var NotificationHelper = require('./../components/helpers/notification');
var PushNotificationHelper = require('./../components/helpers/PushNotification');
var _ = require('lodash');
var async = require('async');


EventBus.onSeries('File.Inserted', function(file, next) {
    if (file.element.type === "file") {
        if (file.members.length > 0) {
            var owners = _.clone(file.members);
            owners.push(file.owner);
            owners = _.map(_.groupBy(owners,function(doc){
                return doc;
            }),function(grouped){
                return grouped[0];
            });
            _.remove(owners, file.owner);
            var params = {
                owners : owners,
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
    } else if (file.element.type==="document" && file._editType==="uploadBulkDocument") {
        Document.findById(file.documentSet, function(err, documentSet) {
            if (err||!documentSet) {return next();}
            else {
                var owners = documentSet.members;
                owners = _.map(_.groupBy(owners,function(doc){
                    return doc;
                }),function(grouped){
                    return grouped[0];
                });
                owners.push(documentSet.owner);
                _.remove(owners, file.editUser._id);
                var params = {
                    owners : documentSet.members,
                    fromUser : file.editUser._id,
                    element : file,
                    referenceTo : 'document',
                    type : 'document-upload-reversion'
                };
                NotificationHelper.create(params, function() {
                    return next();
                });
            }
        });
    } else {
        return next();
    }
});

EventBus.onSeries('File.Updated', function(file, next) {
    if (file._editType==="uploadReversion") {
        if (file.element.type === "document" && file.documentSet) {
            Document.findById(file.documentSet, function(err, documentSet) {
                if (err||!documentSet) {return next();}
                else {
                    var owners = documentSet.members;
                    owners.push(documentSet.owner);
                    owners = _.map(_.groupBy(owners,function(doc){
                        return doc;
                    }),function(grouped){
                        return grouped[0];
                    });
                    _.remove(owners, file.editUser._id);
                    var params = {
                        owners : owners,
                        fromUser : file.editUser._id,
                        element : file,
                        referenceTo : 'document',
                        type : 'document-upload-reversion'
                    };
                    NotificationHelper.create(params, function() {
                        return next();
                    });
                }
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
    } else if (file._editType==="sendAcknowledge") {
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
    } else if (file._editType==="insert-note") {
        var owners = _.clone(file.members);
        owners.push(file.owner);
        _.remove(owners, file.editUser._id);
        _.uniq(owners);
        var params = {
            owners : owners,
            fromUser : file.editUser._id,
            element : file,
            referenceTo : 'file',
            type : 'file-new-note'
        };
        NotificationHelper.create(params, function() {
            return next();
        });
    } else if (file._editType==="archive") {
        Notification.find({"element._id": file._id, unread: true}, function(err, notifications) {
            if (err) {return next();}
            async.each(notifications, function(n, cb) {
                n.unread = false;
                n.save(cb);
            }, function() {
                return next();
            });
        });
    } else if (file._editType==="create-related-item") {
        var owners = _.clone(file.members);
        owners.push(file.owner);
        owners = _.map(_.groupBy(owners,function(doc){
            return doc;
        }),function(grouped){
            return grouped[0];
        });
        _.remove(owners, file.editUser._id);
        var params = {
            owners: owners,
            fromUser: file.editUser._id,
            element: file,
            referenceTo: "file",
            type: "related-item"
        };
        NotificationHelper.create(params,function() {
            return next();
        });
    } else {
        return next();
    }
});