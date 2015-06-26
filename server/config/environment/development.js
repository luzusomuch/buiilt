'use strict';

// Development specific configuration
// ==================================
module.exports = {
  //have to have / at the end
  //change to ngrok url to setup voice url, otherwise we have to update in the sub account manually
  baseUrl: 'http://localhost:9000/',
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
      user: 'postmaster@sandboxad9be0fa2c834fba8055df5df5e686db.mailgun.org', // mailgun username
      pass: '303dd311e93ac992ef0abf6c8c90afbf'  // mailgun password
    }
  },
  logentries : {
    token : process.env.LOGENTRIES_TOKEN
  }
};
