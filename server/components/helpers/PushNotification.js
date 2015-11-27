var apnagent = require('apnagent')
  , agent = new apnagent.Agent();
var device = require('./../../models/device.model');
var Notification = require('./../../models/notification.model');
var _ = require('lodash');
var gcm = require('node-gcm'),
  messageGcm = new gcm.Message();


exports.getData = function(projectId,id,threadName, message, users, type){
    agent
        .set('cert file', __dirname+'/../../cert/PushChatCert.pem')
        .set('key file', __dirname+'/../../cert/PushChatKey.pem')    
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
    });

   

   agent.connect(function (err) {
    var msg = '';
     // gracefully handle auth problems
     if (err && err.name === 'GatewayAuthorizationError') {        
      console.log ({
        status: "error",
        message: 'Authentication Error: '+err.message
      });
     }

     // handle any other err (not likely)
     else if (err) {
      console.log ({
        status: "error",
        message: err
      });
     }
    
    // it worked!
  var env = agent.enabled('sandbox')
    ? 'sandbox'
    : 'production';

  console.log('apnagent [%s] gateway connected', env);
      
   });
   // console.log('device token: '+ req.body.deviceid);    

   //push notification test
   _.each(users, function(user){
    
    device.find({'user' : user}, function(err, devices) {
      if (err) {console.log(err);}
      // if (!device) {return res.send(404,err);}
      if (devices) {
        _.each(devices, function(device){
          if (device.platform == 'ios') {
            Notification.find({owner: user, unread:true, $or:[{referenceTo: 'task'},{referenceTo: 'thread'}]}, function(err, notifications){
              if (err) {console.log(err);}
              // if (!notifications) {return res.send(404);}
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
                if (!err) {console.log('success');}
                console.log(err);
              });
            });
          }
          else if (device.platform == 'android') {
            var path = '';
            if (type == 'task') {
              path = "#/task/"+id;
            } else if (type == "board") {
              path = "#/board/" + id;
            } else if (type == "people") {
              path = "#/"+projectId+"/people-chat/" + id;
            }
            else if (type == 'message') {
              path = "#/"+projectId+"/thread/"+id;
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
                console.log(err);
              } else {
                console.log(result);
              }
            });
          }
        });
        //end -.each function
      }
    }); 
  });
};

    
