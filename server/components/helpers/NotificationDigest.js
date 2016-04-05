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

/*
    Create a crontab from monday to friday from 7:00 to 18:00 at every 59 minutes
*/
var job1 = new CronJob('0 59 07-18 * * 1-5', function(){
    getUserNotification();
    getNotificationNonUser();
}, null, false, 'Australia/Melbourne');

job1.start();

/*
    get notifications for all users
    and send via email for each user
*/
function getUserNotification(){
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
                if (moment(moment().format("YYYY-MM-DD")).isSame(moment(new Date(n.createdAt)).format("YYYY-MM-DD"))) {
                    var notificationTime = moment(n.createdAt).format("YYYY-MM-DD HH:mm");
                    if (isValidPreviousHourNotification(notificationTime)){
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

/*
    get notifications for non-users
    send it via email for each non-user
*/
function getNotificationNonUser(){
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
            if (task.element) {
                task.element.notification="task-assign";
                var notificationTime = moment(task.createdAt).format("YYYY-MM-DD HH:mm");
                if (isValidPreviousHourNotification(notificationTime)) {
                    getNotificationForNonUser(task, notificationsListPreviousHour);
                }
            }
        });
        // Get Thread
        _.each(result.threads, function(thread) {
            if (thread.element) {
                thread.element.notification="thread-message";
                var latestMessage = _.last(thread.messages);
                if (latestMessage) {
                    var notificationTime = moment(latestMessage.sendAt).format("YYYY-MM-DD HH:mm");
                    if (isValidPreviousHourNotification(notificationTime)) {
                        getNotificationForNonUser(thread, notificationsListPreviousHour);
                    }
                }
            }
        });
        // Get File
        _.each(result.files, function(file) {
            if (file.element) {
                if (file.element.type==="file") {
                    var notificationTime = moment(file.createdAt).format("YYYY-MM-DD HH:mm");
                    if (isValidPreviousHourNotification(notificationTime)) {
                        file.element.notification="file-assign";
                        getNotificationForNonUser(file, notificationsListPreviousHour);
                    } else {
                        if (file.activities) {
                            _.each(file.activities, function(activity) {
                                if (activity.type==="upload-reversion") {
                                    var notificationTime = moment(activity.createdAt).format("YYYY-MM-DD HH:mm");
                                    if (isValidPreviousHourNotification(notificationTime)) {
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
                                }
                            });
                        }
                    }
                // Get Document
                } else if (file.element.type==="document" && file.fileHistory.length > 0) {
                    if (file.fileHistory) {
                        _.each(file.fileHistory, function(history) {
                            var notificationTime = moment(history.createdAt).format("YYYY-MM-DD HH:mm");
                            if (isValidPreviousHourNotification(notificationTime)) {
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
                            }
                        });
                    }
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

/*
    check if notification is in previous hours
*/
function isValidPreviousHourNotification(notificationTime) {
    if (moment(notificationTime).isBetween(moment().format("YYYY-MM-DD HH:mm"), moment().add(1, "hours").format("YYYY-MM-DD HH:mm"))) {
        return true;
    } else {
        return false;
    }
};

/*
    check if the owner of nofication is already existed or not
    if existed just push new notification
    else will create new owner with notification
*/
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