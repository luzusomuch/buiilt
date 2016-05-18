'use strict';

// Production specific configuration
// =================================
module.exports = {
  // Server IP
  baseUrl: process.env.SITE_URL || 'https://buiilt.com.au/',
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
  stripe: "sk_live_9d6kYbFx1FTtUnpICVhLkV1d",
  logentries : {
    token : process.env.LOGENTRIES_TOKEN
  },
  twilio: {
    sid: "AC3047a0e98a207deaf2a09e79d259d745",
    token: "ee5377c0f01a40ea6a0931d12ccb24d5",
    phoneNumber: "+61400106280"
  }
};