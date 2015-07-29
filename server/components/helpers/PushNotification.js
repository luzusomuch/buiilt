var apnagent = require('apnagent')
  , agent = new apnagent.Agent();
var device = require('./../../models/device.model');
var _ = require('lodash');

exports.getData = function(threadName, message, users){
    agent
        .set('cert file', __dirname+'/../../cert/buiiltCert.pem')
        .set('key file', __dirname+'/../../cert/buiiltKey.pem')    
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
    
    console.log ({
      status: "success",
      message: ''
    });
      
   });
   // console.log('device token: '+ req.body.deviceid);    

   //push notification test
   _.each(users, function(user){
    device.findOne({'user' : user}, function(err, device) {
      if (err) {console.log(err);}
      // if (!device) {return res.send(404,err);}
      if (device) {
        agent.createMessage()
         .device(device.deviceToken)
         .alert(threadName+': '+message)
         .sound('defauld').send(function(err){
          if (err) {console.log(err)}
          console.log('success');
         });
      }
    }); 
  });
};

    
