var Notification = require('./../../models/notification.model');
var Mailer = require('./../Mailer');
var User = require('./../../models/user.model');
var config = require('./../../config/environment');
var async = require('async');
var _ = require('lodash');
var moment = require("moment");
var CronJob = require('cron').CronJob;

// var job1 = new CronJob('0 */1 * * * *', function(){
//     run()
// }, null, false, 'Australia/Melbourne');

// job1.start();

function getUserNotification(){
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
            if (n.type==="task-assign" || n.type==="thread-assign" || n.type==="file-assign" || n.type==="document-upload-reversion") {
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
            Mailer.sendMail('notifications-user-previous-hour.html', config.emailFrom, n.owner.email, {
                invitee: n.owner,
                notifications: n.notifications,
                link : config.baseUrl + 'dashboard/tasks',
                subject: "Hourly Notifications Digest"
            },function(err){console.log(err);});
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