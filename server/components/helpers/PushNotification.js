var apnagent = require('apnagent')
  , agent = new apnagent.Agent();
var device = require('./../../models/device.model');
var Notification = require('./../../models/notification.model');
var _ = require('lodash');
var async = require('async');
var gcm = require('node-gcm'),
  messageGcm = new gcm.Message();


exports.getData = function(projectId,id,threadName, message, users, type, cb){
    agent
        .set('cert file', __dirname+'/../../cert/BuiiltPushChatCert.pem')
        .set('key file', __dirname+'/../../cert/BuiiltPushChatKey.pem')    
        .set('passphrase', '123456')
        .disable('sandbox');//enable production
        // .enable('sandbox');//disable production
    
    agent.on('message:error', function (err, msg) {
        var errMsg = '';
        switch (err.name) {
    // This error occurs when Apple reports an issue parsing the message.
        case 'GatewayNotificationError':      
            errMsg = '[message:error] GatewayNotificationError: '+err.message; 
      // The err.code is the number that Apple reports.
      // Example: 8 means the token supplied is invalid or not subscribed
      // to notifications for your application.
            if (err.code === 8) {    
                errMsg = '[message:error] GatewayNotificationError: '+err.message; 
     // In production you should flag this token as invalid and not
     // send any futher messages to it until you confirm validity
            }
      
        break;

    // This happens when apnagent has a problem encoding the message for transfer
        case 'SerializationError':
            errMsg = '[message:error] SerializationError:' + err.message;      
        break;

    // unlikely, but could occur if trying to send over a dead socket
        default:
            errMsg = '[message:error] other error: '+ err.message;      
            break;
        }
        console.log({
            status: "error",
            message: errMsg
        });
        cb(err);
    });

   

    agent.connect(function (err) {
        var msg = '';
        // gracefully handle auth problems
        if (err && err.name === 'GatewayAuthorizationError') {        
            console.log ({
                status: "error",
                message: 'Authentication Error: '+err.message
            });
            cb(err);
        }

    // handle any other err (not likely)
        else if (err) {
            console.log ({
                status: "error",
                message: err
            });
            cb(err);
        }
    
    // it worked!
        else {
            var env = agent.enabled('sandbox') ? 'sandbox' : 'production';
            console.log('apnagent [%s] gateway connected', env);
            cb(null);
        }
    });

    //push notification test
    async.each(users, function(user, cb){
        device.find({'user' : user}, function(err, devices) {
            if (err) {console.log(err);cb(err);}
            if (devices) {
                async.each(devices, function(device, callback){
                    if (device.platform == 'ios') {
                        Notification.find({owner: user, unread:true, $or:[{referenceTo: 'task'},{referenceTo: 'thread'}]}, function(err, notifications){
                            if (err) {console.log(err);callback(err);}
                            else {
                                var totalBadge = notifications.length;
                                agent.createMessage()
                                .device(device.deviceToken)
                                .alert(threadName+': '+message)
                                .badge(totalBadge)
                                .set("push", true)
                                .set("relatedto", type)
                                .set("id", id)
                                .set("projectid", projectId)
                                .sound('defauld').send(function(err){
                                    if (err) {console.log(err);callback(err);}
                                    else {callback(null);}
                                });
                            }
                        });
                    } else if (device.platform == 'android') {
                        var path = '';
                        if (type == 'task') {
                            path = "#/task/"+id;
                        } else if (type == 'thread') {
                            path = "#/thread/"+id;
                        }
                        var sender = new gcm.Sender("AIzaSyABcNG7VNgSzOhXIxapNGxmQWLElWHgHDU");//api id
                        messageGcm.addData('message', message);
                        messageGcm.addData('hasSound', true);
                        messageGcm.addData('title', threadName+': '+message);
                        messageGcm.addData('path', path);
                        messageGcm.delayWhileIdle = true;
                        //sender.send(message, device.deviceid, 4, function (err, result) {
                        sender.sendNoRetry(messageGcm, device.deviceToken, function (err, result) {
                            if (err) {
                                console.log(err);callback(err);
                            } else {
                                console.log(result);
                                callback(null);
                            }
                        });
                    }
                }, function(err) {
                    if (err) {cb(err);}
                    else {cb(null);}
                });
            }
        }); 
    }, function(err) {
        if (err) {console.log("Error on send push notification :" + err);return cb(err);}
        else {return cb(null);}
    });
};

    
