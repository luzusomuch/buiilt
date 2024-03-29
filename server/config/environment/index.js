'use strict';

var path = require('path');
var _ = require('lodash');

function requiredProcessEnv(name) {
  if(!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable');
  }
  return process.env[name];
}

// All configurations will extend these options
// ============================================
var all = {
  env: process.env.NODE_ENV,

  // Root path of server
  root: path.normalize(__dirname + '/../../..'),

  // new root path
  newRoot: path.normalize(__dirname + '/../../../csv/'),

  //Path to media file
  media: path.normalize(__dirname + '/../../../client/media/files/'),

  // Server port
  port: process.env.PORT || 9000,

  // Should we populate the DB with sample data?
  seedDB: false,

  // Secret for session, you will want to change this and make it an environment variable
  secrets: {
    session: 'slick-call-secret'
  },

  // List of user roles
  userRoles: ['guest', 'user', 'admin', 'manager', 'agent'],

  // MongoDB connection options
  mongo: {
    options: {
      db: {
        safe: true
      }
    }
  },

  facebook: {
    clientID:     process.env.FACEBOOK_ID || 'id',
    clientSecret: process.env.FACEBOOK_SECRET || 'secret',
    callbackURL:  (process.env.DOMAIN || '') + '/auth/facebook/callback'
  },

  twitter: {
    clientID:     process.env.TWITTER_ID || 'id',
    clientSecret: process.env.TWITTER_SECRET || 'secret',
    callbackURL:  (process.env.DOMAIN || '') + '/auth/twitter/callback'
  },

  google: {
    clientID:     process.env.GOOGLE_ID || 'id',
    clientSecret: process.env.GOOGLE_SECRET || 'secret',
    callbackURL:  (process.env.DOMAIN || '') + '/auth/google/callback'
  },

  s3Options: {
            accessKeyId: 'AKIAICAYUM6RPT5MOCMQ',
            secretAccessKey: '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',
          },
		  
  Bucket: 'buiilt',

  ssl: process.env.SSL || false,

  roles: ["builders", "clients", "architects", "contractors", "consultants"]

  // s3Options: {
  //           accessKeyId: 'AKIAI7KKFT6PBJRLBZKQ',
  //           secretAccessKey: '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',
  //         },
  // Bucket: 'hvs3',
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
  all,
  require('./' + process.env.NODE_ENV + '.js') || {});