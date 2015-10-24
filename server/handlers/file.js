'use strict';

var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var File = require('./../models/file.model');
var Project = require('./../models/project.model');
var BuilderPackage = require('./../models/builderPackage.model');
var Team = require('./../models/team.model');
var Notification = require('./../models/notification.model');
var NotificationHelper = require('./../components/helpers/notification');
var Mailer = require('./../components/Mailer');
var _ = require('lodash');
var async = require('async');


EventBus.onSeries('File.Inserted', function(request, next) {
    if (request.belongToType == 'design') {
        File.find({project: request.project, belongTo: request.belongTo}, function(err, _files){
            if (err) {return next();}
            if (_files.length > 1) {
                File.findByIdAndRemove(_files[0]._id, function(err){
                    if (err) {console.log(err);return next();}
                    return next();
                });
            } else {
                return next();
            }
        });
    } else if (request.belongToType == "people") {
        var params = {
            owners : request.usersRelatedTo,
            fromUser : request.user,
            element : request,
            referenceTo : 'documentInPeople',
            type : 'uploadDocument'
        };
        NotificationHelper.create(params, function() {
            next();
        });
    } else {
        return next();
    }
});