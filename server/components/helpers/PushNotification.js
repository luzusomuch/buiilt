var apnagent = require('apnagent')
  , agent = new apnagent.Agent();
var device = require('./../../models/device.model');
var Notification = require('./../../models/notification.model');
var _ = require('lodash');
var async = require('async');
var gcm = require('node-gcm'),
  messageGcm = new gcm.Message();

/*
    get data to create push notification for ionic app
    require projectId, elementId, message, user and type
*/
exports.getData = function(projectId, id, message, user, type, cb){
    agent
        .set('pfx file', __dirname+'/../../cert/Certificates.p12')
        .set('passphrase', '123456')
        .disable('sandbox');//enable production
        // .enable('sandbox');//disable production
    
    agent.on('message:error', function (err, msg) {
        switch (err.name) {
        // This error occurs when Apple reports an issue parsing the message.
            case 'GatewayNotificationError':
                console.log('[message:error] GatewayNotificationError: %s', err.message);

                // The err.code is the number that Apple reports.
                // Example: 8 means the token supplied is invalid or not subscribed
                // to notifications for your application.
                if (err.code === 8) {
                    console.log('    > %s', msg.device().toString());
                    // In production you should flag this token as invalid and not
                    // send any futher messages to it until you confirm validity
                }

            break;

            // This happens when apnagent has a problem encoding the message for transfer
            case 'SerializationError':
                console.log('[message:error] SerializationError: %s', err.message);
            break;

            // unlikely, but could occur if trying to send over a dead socket
            default:
                console.log('[message:error] other error: %s', err.message);
            break;
        }
    });

    agent.connect(function (err) {
        var msg = '';
        // gracefully handle auth problems
        if (err && err.name === 'GatewayAuthorizationError') {        
            console.log ({
                status: "error",
                message: 'Authentication Error: '+err
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
        }
    });

    // get user devices token
    device.find({'user' : user}, function(err, devices) {
        if (err) {console.log(err);cb(null);}
        if (devices && devices.length > 0) {
            async.each(devices, function(device, callback){
                if (device.platform == 'ios') {
                    Notification.find({owner: user, unread:true, $or:[{type: "task-enter-comment"}, {type: "task-completed"}, {type: "task-reopened"}, {type: "thread-message"}, {type: "file-upload-reversion"}, {type: "document-upload-reversion"}, {type: "related-item"}, {type: "invite-to-project"}]}, function(err, notifications){
                        if (err) {console.log(err);callback(err);}
                        else {
                            var totalBadge = _.map(_.groupBy(notifications,function(doc){
                                return doc.element._id;
                            }),function(grouped){
                              return grouped[0];
                            });
                            agent.createMessage()
                            .device(device.deviceToken)
                            .alert(message)
                            .badge(totalBadge)
                            .set("push", true)
                            .set("relatedto", type)
                            .set("id", id)
                            .set("projectid", projectId)
                            .sound('defauld').send(function(err){
                                if (err) {console.log(err);callback(err);}
                                else {console.log("Sent");callback(null);}
                            });
                        }
                    });
                } else if (device.platform == 'android') {
                    var path = '';
                    if (type == 'task') {
                        path = "#/task/"+id;
                    } else if (type == 'thread') {
                        path = "#/thread/"+id;
                    } else if (type == "project") {
                        path = "#/dashboard";
                    }
                    var sender = new gcm.Sender("AIzaSyABcNG7VNgSzOhXIxapNGxmQWLElWHgHDU");//api id
                    messageGcm.addData('message', message);
                    messageGcm.addData('hasSound', true);
                    messageGcm.addData('title', message);
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
                } else {
                    callback(null);
                }
            }, function(err) {
                if (err) {cb(err);}
                else {cb(null);}
            });
        } else {
            cb(null);
        }
    }); 
};

    
