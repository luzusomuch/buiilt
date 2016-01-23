'use strict';

// Development specific configuration
// ==================================
module.exports = {
  //have to have / at the end
  //change to ngrok url to setup voice url, otherwise we have to update in the sub account manually
  baseUrl: process.env.SITE_URL || 'http://localhost:9000/',
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
  //sendgrid api key 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

  emailFrom: 'Buiilt <no-reply@buiilt.com.au>', // sender address like ABC <abc@example.com>
  mailer: {
    service: 'mailgun',
    auth: {
      api_key: 'key-0245b8bd3122b95cef10c8a5df83079b',
	  domain: 'mg.buiilt.com.au'
    }
   // service: 'sendgrid',
   // auth: {
   //  api_user: 'leenguyenhvs',
   //  api_key: 'buiilt2015'
   // }
  },
  stripe: "sk_test_eZgUkcwEZlB7HcHKeMpoy7JQ",
  logentries : {
    token : process.env.LOGENTRIES_TOKEN
  }
};
