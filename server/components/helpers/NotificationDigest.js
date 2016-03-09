var Notification = require('./../../models/notification.model');
var Mailer = require('./../Mailer');
var User = require('./../../models/user.model');
var Task = require('./../../models/task.model');
var Thread = require('./../../models/thread.model');
var File = require('./../../models/file.model');
var PackageInvite = require('./../../models/packageInvite.model');
var config = require('./../../config/environment');
var async = require('async');
var _ = require('lodash');
var moment = require("moment");
var CronJob = require('cron').CronJob;

console.log("IN THE NOTIFICATION Digest");
var job1 = new CronJob('0 50 07-18 * * 1-5', function(){
    console.log("Cron start");
    getUserNotification();
    getNotificationNonUser();
}, null, false, 'Australia/Melbourne');

job1.start();

// var job2 = new CronJob('00 38 07-18 * * 1-5', function(){
//     console.log("RUN EVERY 1 secnd");
// }, null, false, 'Australia/Melbourne');

// job2.start();



function getUserNotification(){
    console.log("GET USER");
    var today = new Date();
    var currentTime = today.getHours()+":"+today.getMinutes();
    Notification.find({unread: true})
    .populate("owner", "_id name email")
    .populate("fromUser", "_id name email")
    .exec(function(err, notifications) {
        if (err) {console.log(err);}
        // get all notification and all notification in previous hour
        var notificationsList = [];
        var notificationsListPreviousHour = [];
        _.each(notifications, function(n) {
            if (n.type==="task-assign" || n.type==="thread-message" || n.type==="file-assign" || n.type==="file-upload-reversion" || n.type==="document-upload-reversion") {
                notificationsList.push({owner: n.owner, notification: n});
                if (moment(moment(today).format("YYYY-MM-DD")).isSame(moment(new Date(n.createdAt)).format("YYYY-MM-DD"))) {
                    var notificationTime = new Date(n.createdAt).getHours() +":"+ new Date(n.createdAt).getMinutes();
                    if (isValidPreviousHourNotification(notificationTime, currentTime)){
                        var currentOnwerIndex = _.findIndex(notificationsListPreviousHour, function(item) {
                            if (item.owner) {
                                return item.owner._id.toString()===n.owner._id.toString();
                            }
                        });
                        if (currentOnwerIndex === -1) {
                            notificationsListPreviousHour.push({owner: n.owner, notifications: [n]});
                        } else {
                            notificationsListPreviousHour[currentOnwerIndex].notifications.push(n);
                        }
                    }
                }
            }
        });

        // Fire email to owner
        _.each(notificationsListPreviousHour, function(n) {
            if (n.notifications.length > 0) {
                Mailer.sendMail('notifications-user-previous-hour.html', config.emailFrom, n.owner.email, {
                    inPastHour: "in the past hour",
                    invitee: n.owner,
                    notifications: n.notifications,
                    link : config.baseUrl + 'dashboard/tasks',
                    subject: "Hourly Notifications Digest"
                },function(err){console.log(err);});
            }
        });
    });
};

function getNotificationNonUser(){
    console.log("GET NON USER");
    var today = new Date();
    var currentTime = today.getHours()+":"+today.getMinutes();
    async.parallel({
        tasks: function(cb) {
            Task.find({}).populate("owner").exec(cb);
        },
        threads: function(cb) {
            Thread.find({}).populate("owner").exec(cb);
        },
        files: function(cb) {
            File.find({}).populate("owner").exec(cb);
        }
    }, function(err, result) {
        if (err) {console.log(err);}
        var notificationsListPreviousHour = [];
        // Get Task
        _.each(result.tasks, function(task) {
            task.element.notification="task-assign";
            var notificationTime = new Date(task.createdAt).getHours() +":"+ new Date(task.createdAt).getMinutes();
            if (isValidPreviousHourNotification(notificationTime, currentTime)) {
                getNotificationForNonUser(task, notificationsListPreviousHour);
            }
        });
        // Get Thread
        _.each(result.threads, function(thread) {
            thread.element.notification="thread-message";
            var latestMessage = _.last(thread.messages);
            if (latestMessage) {
                var notificationTime = new Date(latestMessage.sendAt).getHours() +":"+ new Date(latestMessage.sendAt).getMinutes();
                if (isValidPreviousHourNotification(notificationTime, currentTime)) {
                    getNotificationForNonUser(thread, notificationsListPreviousHour);
                }
            }
        });
        // Get File
        _.each(result.files, function(file) {
            if (file.element.type==="file") {
                var notificationTime = new Date(file.createdAt).getHours() +":"+ new Date(file.createdAt).getMinutes();
                if (isValidPreviousHourNotification(notificationTime, currentTime)) {
                    file.element.notification="file-assign";
                    getNotificationForNonUser(file, notificationsListPreviousHour);
                } else {
                    if (file.activities) {
                        _.each(file.activities, function(activity) {
                            if (activity.type==="upload-reversion") {
                                _.each(activity.acknowledgeUsers, function(user) {
                                    if (user.email) {
                                        var fileIndex = _.findIndex(notificationsListPreviousHour, function(item) {
                                            return item.owner===user.email;
                                        });
                                        file.element.notification="file-upload-reversion";
                                        if (fileIndex===-1) {
                                            notificationsListPreviousHour.push({owner: user.email, notifications: [file]});
                                        } else {
                                            notificationsListPreviousHour[fileIndex].notifications.push(file);
                                        }
                                    }
                                });
                            }
                        });
                    }
                }
            // Get Document
            } else if (file.element.type==="document" && file.fileHistory.length > 0) {
                if (file.fileHistory) {
                    _.each(file.fileHistory, function(history) {
                        _.each(history.members, function(member) {
                            if (member.email) {
                                var documentIndex = _.findIndex(notificationsListPreviousHour, function(item) {
                                    return item.owner===member.email;
                                });
                                file.element.notification="document-upload-reversion";
                                if (documentIndex===-1) {
                                    notificationsListPreviousHour.push({owner: member.email, notifications: [file]});
                                } else {
                                    notificationsListPreviousHour[documentIndex].notifications.push(file);
                                }
                            }
                        });
                    });
                }
            }
        });
        _.each(notificationsListPreviousHour, function(user) {
            if (user.notifications.length > 0) {
                PackageInvite.findOne({to: user.owner}, function(err, packageInvite) {
                    if (err) {console.log(err);}
                    if (!packageInvite) {console.log("No Package Invite Found");}
                    else {
                        Mailer.sendMail('notifications-non-user-previous-hour.html', config.emailFrom, user.owner, {
                            inPastHour: "in the past hour",
                            invitee: user.owner,
                            notifications: user.notifications,
                            link : config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                            subject: "Hourly Notifications Digest"
                        },function(err){console.log(err);});
                    }
                });
            }
        });
    });
};

// this function will fire when 17:00 to get whole notifications for user
function getAllNotificationsForUser() {
    Notification.find({unread: true})
    .populate("owner", "_id name email")
    .populate("fromUser", "_id name email")
    .exec(function(err, notifications) {
        if (err) {console.log(err);}
        // get all notification and all notification in previous hour
        var notificationsList = [];
        _.each(notifications, function(n) {
            if (n.type==="task-assign" || n.type==="thread-message" || n.type==="file-assign" || n.type==="file-upload-reversion" || n.type==="document-upload-reversion") {
                var currentOnwerIndex = _.findIndex(notificationsList, function(item) {
                    if (item.owner) {
                        return item.owner._id.toString()===n.owner._id.toString();
                    }
                });
                if (currentOnwerIndex === -1) {
                    notificationsList.push({owner: n.owner, notifications: [n]});
                } else {
                    notificationsList[currentOnwerIndex].notifications.push(n);
                }
            }
        });

        // Fire email to owner
        _.each(notificationsList, function(n) {
            if (n.notifications.length > 0) {
                Mailer.sendMail('notifications-user-previous-hour.html', config.emailFrom, n.owner.email, {
                    invitee: n.owner,
                    notifications: n.notifications,
                    link : config.baseUrl + 'dashboard/tasks',
                    subject: "Hourly Notifications Digest"
                },function(err){console.log(err);});
            }
        });
    });
};

// this function will fire when 17:00 to get whole notifications for non user
function getAllNotificationsForNonUser() {
    async.parallel({
        tasks: function(cb) {
            Task.find({}).populate("owner").exec(cb);
        },
        threads: function(cb) {
            Thread.find({}).populate("owner").exec(cb);
        },
        files: function(cb) {
            File.find({}).populate("owner").exec(cb);
        }
    }, function(err, result) {
        if (err) {console.log(err);}
        var notificationsList = [];
        // Get Task
        _.each(result.tasks, function(task) {
            task.element.notification="task-assign";
            getNotificationForNonUser(task, notificationsList);
        });
        // Get Thread
        _.each(result.threads, function(thread) {
            thread.element.notification="thread-message";
            var latestMessage = _.last(thread.messages);
            if (latestMessage) {
                getNotificationForNonUser(thread, notificationsList);
            }
        });
        // Get File
        _.each(result.files, function(file) {
            if (file.element.type==="file") {
                file.element.notification="file-assign";
                getNotificationForNonUser(file, notificationsList);
                _.each(file.activities, function(activity) {
                    if (activity.type==="upload-reversion") {
                        _.each(activity.acknowledgeUsers, function(user) {
                            if (user.email) {
                                var fileIndex = _.findIndex(notificationsList, function(item) {
                                    return item.owner===user.email;
                                });
                                file.element.notification="file-upload-reversion";
                                if (fileIndex===-1) {
                                    notificationsList.push({owner: user.email, notifications: [file]});
                                } else {
                                    notificationsList[fileIndex].notifications.push(file);
                                }
                            }
                        });
                    }
                });
            // Get Document
            } else if (file.element.type==="document" && file.fileHistory.length > 0) {
                _.each(file.fileHistory, function(history) {
                    _.each(history.members, function(member) {
                        if (member.email) {
                            var documentIndex = _.findIndex(notificationsList, function(item) {
                                return item.owner===member.email;
                            });
                            file.element.notification="document-upload-reversion";
                            if (documentIndex===-1) {
                                notificationsList.push({owner: member.email, notifications: [file]});
                            } else {
                                notificationsList[documentIndex].notifications.push(file);
                            }
                        }
                    });
                });
            }
        });
        _.each(notificationsList, function(user) {
            if (user.notifications.length > 0) {
                PackageInvite.findOne({to: user.owner}, function(err, packageInvite) {
                    if (err) {console.log(err);}
                    if (!packageInvite) {console.log("No Package Invite Found");}
                    else {
                        Mailer.sendMail('outstanding-notification-non-user.html', config.emailFrom, user.owner, {
                            invitee: user.owner,
                            notifications: user.notifications,
                            link : config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                            subject: "Hourly Notifications Digest"
                        },function(err){console.log(err);});
                    }
                });
            }
        });
    });
};

function isValidPreviousHourNotification(notificationTime, currentTime) {
    // valid when notification time smaller than current time
    // and greator than current time substract an hour
    var t = currentTime.split(":");
    var previousTime = t[0]-1+":"+t[1];
    if (Date.parse("01/01/2011 "+notificationTime+":00") > Date.parse("01/01/2011 "+previousTime+":00") && Date.parse("01/01/2011 "+notificationTime+":00") < Date.parse("01/01/2011 "+currentTime+":00")) {
        return true;
    } else {
        return false;
    }
};

function getNotificationForNonUser(item, notificationsListPreviousHour) {
    if (item.notMembers) {
        _.each(item.notMembers, function(email) {
            var index = _.findIndex(notificationsListPreviousHour, function(n) {
                return n.owner.toString()===email.toString();
            });
            if (index===-1) {
                notificationsListPreviousHour.push({owner: email, notifications: [item]});
            } else {
                notificationsListPreviousHour[index].notifications.push(item);
            }
        });
    }
}