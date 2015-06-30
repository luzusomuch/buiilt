var _ = require('lodash');
'use strict';

var Mailer = require('./../../components/Mailer');
var EventBus = require('./../../components/EventBus');
var Project = require('./../../models/project.model');
var Team = require('./../../models/team.model');
var User = require('./../../models/user.model');
var ContractorPackage = require('./../../models/contractorPackage.model');
var PackageInvite = require('./../../models/packageInvite.model');
var config = require('./../../config/environment');
var async = require('async');

EventBus.onSeries('PackageInvite.Inserted', function(request, next) {
  return next();
    // async.parallel({
    //     user: function(cb){
    //         User.findOne({_id: request.owner}, cb);
    //     },
    //     project: function(cb){
    //       //find project
    //         Project.findOne({_id: request.project}, cb);
    //     }
    // }, function(err, result){
    //     if (!err) {
    //         PackageInvite.find({package: request.package}, function(err, packageInvites) {
    //             if (err || !packageInvites) {next();}
    //             else {
    //                 async.each(packageInvites, function(packageInvite, cb){
    //                     if (packageInvite.inviteType == 'contractor') {
    //                         Mailer.sendMail('contractor-package-request-no-account.html', packageInvite.to, {
    //                             contractorPackage: request,
    //                               //project owner
    //                             user: result.user,
    //                             project: result.project,
    //                             registryLink: config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
    //                             contractorPackageLink: config.baseUrl  + result.project._id + '/contractor-requests/' + request._id,
    //                             subject: 'Quote request for ' + request.name
    //                         }, function() {
    //                             return cb();
    //                         });
    //                     }else if(packageInvite.inviteType == 'supplier') {
    //                         Mailer.sendMail('supplier-package-send-quote-no-account.html', packageInvite.to, {
    //                           materialPackage: request,
    //                           //project owner
    //                           user: result.user,
    //                           project: result.project,
    //                           registryLink: config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
    //                           link: config.baseUrl + result.project._id + '/material-request/' + request._id,
    //                           subject: 'Quote request for ' + request.name
    //                         }, function(err) {
    //                           return cb();
    //                         });
    //                     }else {
    //                         return cb();
    //                     }
    //                 }, function(){
				// 		return next();
				// 	});
    //             }
    //         });
    //     }
    //     else {
    //         return next();
    //     }
    // });
    
});