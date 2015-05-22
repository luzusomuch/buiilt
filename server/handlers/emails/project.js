/**
 * Broadcast updates to client when the model changes
 */
var _ = require('lodash');
'use strict';

var Mailer = require('./../../components/Mailer');
var EventBus = require('./../../components/EventBus');
var User = require('./../../models/user.model');
var config = require('./../../config/environment');

/**
 * event handler after creating new account
 */
EventBus.onSeries('Project.Inserted', function(project, next) {
    //find user to send email
    var emails=[];
    _.each(project.requestedHomeBuilders, function(requestedHomeBuilder) {
        User.find({'email' : requestedHomeBuilder.email}, function(err, users){
        if(users.length){
            _.each(users, function(user){
                Mailer.sendMail('invite-home-builder-send-quote-has-account.html', user.email, {
                  project: project,
                  projectLink : config.baseUrl + 'quote/' + project._id,
                  subject: 'Invite home builder send quote '
                }, function(){});
                emails.push(user.email);
            });
        }
        else if(_.difference(emails, [requestedHomeBuilder.email])){
            Mailer.sendMail('invite-home-builder-send-quote-no-account.html', requestedHomeBuilder.email, {
              project: project,
              registryLink : config.baseUrl + 'signup/',
              subject: 'Invite home builder send quote '
            }, function(){});
        }
    });
});
});