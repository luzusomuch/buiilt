var apnagent = require('apnagent')
  , agent = new apnagent.Agent();
var device = require('./../../models/device.model');
var Notification = require('./../../models/notification.model');
var _ = require('lodash');
var gcm = require('gcm'),
  messageGcm = new gcm.Message();


exports.getData = function(projectId,id,threadName, message, users, type){
    agent
        .set('cert file', __dirname+'/../../cert/PushChatCert3.pem')
        .set('key file', __dirname+'/../../cert/PushChatKey3.pem')    
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
    console.log(user);
    
    device.findOne({'user' : user}, function(err, device) {
      if (err) {console.log(err);}
      // if (!device) {return res.send(404,err);}
      if (device) {
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
          console.log(device);
          var path = '';
          if (type == 'task') {
            path = "#/"+projectid+"/task/"+id;
          }
          else if (type == 'message') {
            path = "#/"+projectid+"/thread/"+id;
          }
          var sender = new gcm.Sender("AIzaSyC6g7JMT-KKmYKdhCZ27ymy-g6A7vUljG0");//api id
          messageGcm.addData('message', threadName+': '+message);
          messageGcm.addData('hasSound', true);
          messageGcm.addData('title', message);
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
      }
    }); 
  });
};

    
