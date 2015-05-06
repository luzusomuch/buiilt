'use strict';

// Development specific configuration
// ==================================
module.exports = {
  //have to have / at the end
  //change to ngrok url to setup voice url, otherwise we have to update in the sub account manually
  baseUrl: 'https://localhost:9000/',
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
    service: 'mailgun', //smtp, mailgun
    auth: {
      user: process.env.MAILER_USER,
      pass: process.env.MAILER_PASS
    }
  },
  logentries : {
    token : process.env.LOGENTRIES_TOKEN
  }
};
