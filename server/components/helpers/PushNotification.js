var apnagent = require('apnagent')
  , agent = new apnagent.Agent();
var device = require('./../../models/device.model');

exports.getData = function(threadName, message, user){
    agent
        .set('cert file', __dirname+'/../../cert/builtCert.pem')
        .set('key file', __dirname+'/../../cert/builtKey.pem')    
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
        return({
            status: "error",
            message: errMsg
        });
    });

   

   agent.connect(function (err) {
    var msg = '';
     // gracefully handle auth problems
     if (err && err.name === 'GatewayAuthorizationError') {        
    return ({
      status: "error",
      message: 'Authentication Error: '+err.message
    });
     }

     // handle any other err (not likely)
     else if (err) {
    return ({
      status: "error",
      message: err
    });
     }
    
    return ({
      status: "success",
      message: ''
    });
      
   });
   // console.log('device token: '+ req.body.deviceid);    

   //push notification
   device.findOne({'user' : user}, function(err, device) {
        if (err) {return res.send(500,err);}
        // if (!device) {return res.send(404,err);}
        agent.createMessage()
         .device(device._id)
         .alert(threadName+': '+message)
         .sound('defauld').send();
   });
};

    
