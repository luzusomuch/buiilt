var Notification = require('./../../models/notification.model');
var Mailer = require('./../Mailer');
var PackageInvite = require('./../../models/packageInvite.model');
var InviteToken = require('./../../models/inviteToken.model');
var Team = require('./../../models/team.model');
var User = require('./../../models/user.model');
var config = require('./../../config/environment');
var async = require('async');
var _ = require('lodash');
var CronJob = require('cron').CronJob;

var job1 = new CronJob('00 00 12 * * *', function(){
    run()
}, null, false, 'Australia/Melbourne');

var job2 = new CronJob('00 00 17 * * *', function(){
    run();
}, null, false, 'Australia/Melbourne');

job1.start();
job2.start();


function countDuplicate(arr) {
    var a = [], b = [], prev = null;
    
    arr.sort(function(a,b){
        if (a.owner > b.owner) {return 1;}
        if (a.owner < b.owner) {return -1;}
        return 0;
    });
    for ( var i = 0; i < arr.length; i++ ) {
        if ( arr[i].owner.toString() !== prev ) {
            a.push(arr[i].owner.toString());
            b.push(1);
        } else {
            b[b.length-1]++;
        }
        prev = arr[i].owner.toString();
    }
    
    return [a, b];
};

function run(){
    var execArray = ['PackageInvite', 'Notification', 'InviteToken'];
    var result = [];
    async.each(execArray, function(item, callback){
        if (item == 'PackageInvite') {
            PackageInvite.find({}, function(err, packageInvites){
                if (err || packageInvites.length == 0) {return callback();}
                result.push({type: 'PackageInvite', data: packageInvites});
                callback();
            });
        }
        else if (item == 'Notification') {
            Notification.find({
                $or:[{referenceTo: 'task'},{referenceTo: 'thread'},
                {type: 'uploadDocument'},{type: 'uploadNewDocumentVersion'}],
                unread: true
            }, function(err, notifications){
                if (err || notifications.length == 0) {return callback();}
                result.push({type: 'Notification', data: notifications});
                callback();
            })
        }
        else if (item == 'InviteToken') {
            InviteToken.find({}, function(err, inviteTokens){
                if (err || inviteTokens.length == 0) {return callback();}
                result.push({type: 'InviteToken', data: inviteTokens});
                callback();
            })
        }
        else {
            callback();
        }
    }, function(err){
        if (err) {return res.send(500,err);}
        else {
            var templateUrl = '';
            _.each(result, function(item){
                if (item.type == 'PackageInvite') {
                    _.each(item.data, function(data){
                        if (data.inviteType == 'contractor') {
                            templateUrl = 'contractor-package-request-no-account.html';
                        }
                        else if (data.inviteType == 'supplier') {
                            templateUrl = 'supplier-package-send-quote-no-account.html'
                        }
                        else if (data.inviteType == 'homeOwner') {
                            templateUrl = 'invite-homeowner-has-no-account.html';
                        }
                        else if (data.inviteType == 'builder') {
                            templateUrl = 'invite-builder-has-no-account.html';
                        }
                        else {
                            templateUrl = '';
                        }
                        async.parallel({
                            user: function(cb){
                                User.findOne({_id: data.user}, cb);
                            },
                            team: function(cb){
                                Team.findOne({_id: data.owner}, cb);
                            }
                        }, function(err, result){
                            if (!err) {
                                var from = result.user.firstName + " " + result.user.lastName + " | " + result.team.name + "<"+result.user.email+">";
                                Mailer.sendMail(templateUrl, from, data.to, {
                                    team: result.team.toJSON(),
                                    user: result.user.toJSON(),
                                    registryLink : config.baseUrl + 'signup-invite?packageInviteToken=' + data._id,
                                    subject: result.team.name + ' would like a quote'
                                }, function(){});
                            }
                        });
                    });
                }
                else if (item.type == 'InviteToken') {
                    async.each(item.data, function(data, cb){
                        User.findById(data.user, function(err, user){
                            if (err || !user) {return cb(err);}
                            var from = user.firstName + " " + user.lastName + " | " + data.element.name + "<"+user.email+">";
                            Mailer.sendMail('invite-team-has-no-account.html', from, data.email, {
                                request: user.toJSON,
                                link: config.baseUrl + 'signup?inviteToken=' + data.inviteToken,
                                subject: 'Join ' + data.element.name + ' on buiilt'
                            }, function(err){console.log(err);return cb(err);});
                        });
                    }, function(){console.log('success');});
                }
                else if (item.type == 'Notification') {
                    var result = countDuplicate(item.data);
                    var totalNotificationByUser = [];
                    var link = "";
                    var type = "";
                    _.each(result[0], function(owner, key){
                        totalNotificationByUser.push({owner: owner, totalNotifications: result[1][key], links: []});
                    });
                    _.each(item.data, function(data){
                        if (data.type == 'uploadDocument' && data.referenceTo == 'DocumentInProject') {
                            link = config.baseUrl +'projects/'+data.element.projectId;
                            type = "Upload Documentation";
                            _.each(totalNotificationByUser, function(item){
                                if (item.owner == data.owner.toString()) {
                                    item.links.push({link: link, type: type});
                                }
                            });
                        }
                        else if (data.type == 'uploadNewDocumentVersion') {
                            link = config.baseUrl +'projects/'+data.element.projectId;
                            type = "Upload New Documentation";
                            _.each(totalNotificationByUser, function(item){
                                if (item.owner == data.owner.toString()) {
                                    item.links.push({link:link, type: type});
                                }
                            });
                        }
                        else if (data.referenceTo == 'DocumentContractorPackage' || data.referenceTo == 'DocumentMaterialPackage' 
                            || data.referenceTo == 'DocumentStaffPackage' || data.referenceTo == 'DocumentVariation' || data.referenceTo == 'DocumentBuilderPackage') {
                            switch (data.element.uploadIn.type) {
                                case 'BuilderPackage':
                                    link = config.baseUrl +data.element.projectId + '/client/view';
                                    type = "Upload New Documentation In Builder Package";
                                    break;
                                case 'material': 
                                    type = "Upload New Documentation In Material Package";
                                    link = config.baseUrl + data.element.projectId + '/material-request/' + data.element.uploadIn._id + '/processing';
                                    break;
                                case 'contractor':
                                    type = "Upload New Documentation In Contractor Package";
                                    link = config.baseUrl + data.element.projectId + '/contractor-requests/' + data.element.uploadIn._id + '/processing';
                                    break;
                                case 'variation':
                                    type = "Upload New Documentation In Variation";
                                    link = config.baseUrl + data.element.projectId + '/variation-requests/' + data.element.uploadIn._id + '/processing';
                                    break;
                                case 'staffPackage':
                                    type = "Upload New Documentation In Staff Package";
                                    link = config.baseUrl +data.element.projectId + '/staff/' + data.element.uploadIn._id + '/';
                            }
                            link = config.baseUrl +'projects/'+data.element.projectId;
                            _.each(totalNotificationByUser, function(item){
                                if (item.owner == data.owner.toString()) {
                                    item.links.push({link:link, type: type});
                                }
                            });
                        }
                        else if (data.type == 'thread-assign' || data.type == 'thread-message') {
                            type = (data.type == 'thread-assign') ? 'Thread Assigned' : 'Thread message';
                            switch (data.element.type) {
                                case 'staff' :
                                    type = type + ' In Staff Package';
                                    link = config.baseUrl +data.element.project + '/staff/' + data.element.package + '/';
                                    break;
                                case 'builder' :
                                    type = type + ' In Builder Pacakge';
                                    link = config.baseUrl +data.element.project + '/client/view';
                                    break;
                                case 'contractor' :
                                    type = type + ' In Contractor Package';
                                    link = config.baseUrl + data.element.project + '/contractor-requests/' + data.element.package + '/processing';
                                    break;
                                case 'material' :
                                    type = type + ' In Material Package';
                                    link = config.baseUrl + data.element.project + '/material-request/' + data.element.package + '/processing';
                                    break;
                                case 'variation' :
                                    type = type + ' In Variation Package';
                                    link = config.baseUrl + data.element.project + '/variation-requests/' + data.element.package + '/processing';
                                    break;
                            }
                            _.each(totalNotificationByUser, function(item){
                                if (item.owner == data.owner.toString()) {
                                    item.links.push({link:link, type: type});
                                }
                            });
                        }
                        else if (data.type == 'task-assign' || data.type == 'task-revoke') {
                            type = (data.type == 'task-assign') ? 'Task Assigned' : 'Task Revoke';
                            switch (data.element.type) {
                                case 'staff' :
                                    type = type + ' In Staff Package';
                                    link = config.baseUrl +data.element.project + '/staff/' + data.element.package + '/';
                                    break;
                                case 'builder' :
                                    type = type + ' In Builder Pacakge';
                                    link = config.baseUrl +data.element.project + '/client/view';
                                    break;
                                case 'contractor' :
                                    type = type + ' In Contractor Package';
                                    link = config.baseUrl + data.element.project + '/contractor-requests/' + data.element.package + '/processing';
                                    break;
                                case 'material' :
                                    type = type + ' In Material Package';
                                    link = config.baseUrl + data.element.project + '/material-request/' + data.element.package + '/processing';
                                    break;
                                case 'variation' :
                                    type = type + ' In Variation Package';
                                    link = config.baseUrl + data.element.project + '/variation-requests/' + data.element.package + '/processing';
                                    break;
                            }
                            _.each(totalNotificationByUser, function(item){
                                if (item.owner == data.owner.toString()) {
                                    item.links.push({link:link, type: type});
                                }
                            });
                        }
                        else if (data.type == 'task-reopened' || data.type == 'task-completed') {
                            type = (data.type == 'task-reopened') ? 'Task Re-Opened' : 'Task Completed';
                            switch (data.element.type) {
                                case 'staff' :
                                    type = type + ' In Staff Package';
                                    link = config.baseUrl +data.element.project + '/staff/' + data.element.package + '/';
                                    break;
                                case 'builder' :
                                    type = type + ' In Builder Pacakge';
                                    link = config.baseUrl +data.element.project + '/client/view';
                                    break;
                                case 'contractor' :
                                    type = type + ' In Contractor Package';
                                    link = config.baseUrl + data.element.project + '/contractor-requests/' + data.element.package + '/processing';
                                    break;
                                case 'material' :
                                    type = type + ' In Material Package';
                                    link = config.baseUrl + data.element.project + '/material-request/' + data.element.package + '/processing';
                                    break;
                                case 'variation' :
                                    type = type + ' In Variation Package';
                                    link = config.baseUrl + data.element.project + '/variation-requests/' + data.element.package + '/processing';
                                    break;
                            }
                            _.each(totalNotificationByUser, function(item){
                                if (item.owner == data.owner.toString()) {
                                    item.links.push({link:link, type: type});
                                }
                            });
                        }
                    });
                    async.each(totalNotificationByUser, function(notificationByUser, cb){
                        User.findById(notificationByUser.owner, function(err, user){
                            if (err || !user) {return cb(err);}
                            Mailer.sendMail('crontab-notification.html', config.emailFrom, user.email, {
                                user: user.toJSON(),
                                request: notificationByUser,
                                subject: 'Daily email on buiilt'
                            }, function(err){return cb(err);});
                        });
                    }, function(){
                        console.log('success');
                    });
                }
            });
        }
    });
};

// run();