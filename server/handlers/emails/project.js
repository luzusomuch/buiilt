/**
 * Broadcast updates to client when the model changes
 */
var _ = require('lodash');
'use strict';

var Mailer = require('./../../components/Mailer');
var EventBus = require('./../../components/EventBus');
var User = require('./../../models/user.model');
var config = require('./../../config/environment');

EventBus.onSeries('Project.Inserted', function(request, next){
    if (request.type === 'FromHomeOwnerToBuilder') {
        console.log(request.builder);
        if (!request.builder._id) {
            Mailer.sendMail('invite-home-builder-send-quote-no-account.html', request.builder.email, {
                project: request,
                registryLink: config.baseUrl + 'signup',
                link: config.baseUrl + 'builder-packages/' + request._id + '/send-quote',
                subject: 'Invite home builder send quote for ' + request.name
            },function(err){
                return next();
            });
        }
        else if(request.builder._id) {
            Mailer.sendMail('invite-home-builder.html', request.builder.email, {
                project: request,
                link: config.baseUrl + 'builder-packages/' + request._id + '/send-quote',
                subject: 'Invite home builder send quote for ' + request.name
            },function(err){
                return next();
            });
        }
    }
    else if(request.type === 'FromBuilderToHomeOwner') {
        if (!request.user._id) {
            Mailer.sendMail('invite-home-owner-has-no-account.html', request.user.email, {
                project: request,
                link: config.baseUrl + 'signup',
                subject: 'Invite home builder for ' + request.name
            },function(err){
                return next();
            });
        }
        else if(request.user._id) {
            Mailer.sendMail('invite-home-owner.html', request.user.email, {
                project: request,
                link: config.baseUrl + request._id + '/dashboard',
                subject: 'Invite home builder for ' + request.name
            },function(err){
                return next();
            });
        }
    }
});