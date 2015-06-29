'use strict';

// Development specific configuration
// ==================================
module.exports = {
  //have to have / at the end
  //change to ngrok url to setup voice url, otherwise we have to update in the sub account manually
  baseUrl: 'http://ec2-52-25-224-160.us-west-2.compute.amazonaws.com:9000/',
  app: {
    name: 'buiiltApp'
  },

  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/buiilt-dev'
  },

  seedDB: false,

  redis: {
    host: 'localhost',
    port: 6379,
    pass: false
  },

  emailFrom: 'Buiilt <no-reply@buiilt.com>', // sender address like ABC <abc@example.com>
  mailer: {
    service: 'mailgun',
    auth: {
      api_key: 'key-0245b8bd3122b95cef10c8a5df83079b',
	  domain: 'mg.buiilt.com.au'
    }
  },
  logentries : {
    token : process.env.LOGENTRIES_TOKEN
  }
};
