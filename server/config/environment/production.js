'use strict';

// Production specific configuration
// =================================
module.exports = {
  // Server IP
  ip:       process.env.OPENSHIFT_NODEJS_IP ||
            process.env.IP ||
            undefined,

  // Server port
  port:     process.env.OPENSHIFT_NODEJS_PORT ||
            process.env.PORT ||
            8080,

  // MongoDB connection options
  mongo: {
    uri:    process.env.MONGOLAB_URI ||
            process.env.MONGOHQ_URL ||
            process.env.OPENSHIFT_MONGODB_DB_URL+process.env.OPENSHIFT_APP_NAME ||
            'mongodb://localhost/buiilt'
  },
  emailFrom: 'Buiilt <no-reply@buiilt.com.au>', 
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
  logentries : {
    token : process.env.LOGENTRIES_TOKEN
  }
};