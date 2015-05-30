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
    service: 'smtp', //smtp, mailgun
    auth: {
      //user: 'postmaster@sandboxf33fddc2f2f8469fb38592948a17b274.mailgun.org',
      //pass: '47dcb8182067dd4e4286c9c05e29a8c3'
      host: 'hoanvusolutions.com',
      port: 25,
      secure: false,
      auth: {
          user: 'app+projects.hoanvusolutions.com',
          pass: 'Hoanvu2014!'
      },
      tls: {
        rejectUnauthorized:false
      }
    }
  },
  logentries : {
    token : process.env.LOGENTRIES_TOKEN
  }
};
