'use strict';

var EventBus = require('./../../components/EventBus');
var User = require('./../../models/user.model');
var Team = require('./../../models/team.model');
var Mailer = require('./../../components/Mailer');
var PackageInvite = require('./../../models/packageInvite.model');
var _ = require('lodash');
var config = require('./../../config/environment');
var async = require('async');


EventBus.onSeries('ContactBook.Inserted', function(request, next) {
    if (!request.user) {
        var packageInvite = new PackageInvite({
            owner: request.editUser._id,
            to: request.email,
            package: request._id,
            inviteType: "contactBook"
        });
        packageInvite.save(function(err) {
            if (err) {return next();}
            return next();
            // var from = request.editUser.name + "<"+request.editUser.email+">";
            // Mailer.sendMail('invite-non-user-to-be-member.html', from, packageInvite.to, {
            //     inviter: request.editUser.toJSON(),
            //     invitee: {email: packageInvite.to},
            //     link : config.baseUrl + 'signup?packageInviteToken='+packageInvite._id,
            //     subject: request.editUser.name + ' has invited you to be member of Buiilt'
            // },function(err){
            //    return next();
            // });
        });
    } else {
        return next();
    }
});

EventBus.onSeries('ContactBook.Updated', function(request, next) {
    return next();
});