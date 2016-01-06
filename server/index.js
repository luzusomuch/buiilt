/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var mongoose = require('mongoose');
var config = require('./config/environment');
// var NotificationDigest = require('./components/helpers/NotificationDigest');
var fs = require('fs');


// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);

// Populate DB with sample data
if(config.seedDB) { require('./config/seed'); }

var app = express();

if (config.ssl) {
    var options = {
        key: fs.readFileSync('server/ssl/buiilt-private.key'),
        cert: fs.readFileSync('server/ssl/buiilt.com.au.crt'),
        passphrase: '123456',
        requestCert: false,
        rejectUnauthorized: true
    };
    config.port = 9001;
    var server = require('https').createServer(options, app);
} else {
    var server = require('http').createServer(app);
}

// Setup server
// var server = require('http').createServer(app);
var socketio = require('socket.io')(server, {
  serveClient: (config.env === 'production') ? false : true,//this is the development
  // serveClient: (config.env === 'production') ? true : false,//this is the production
  path: '/socket.io-client'
});

//TOTO - should config redis server here
require('./config/socketio')(socketio);
require('./config/express')(app);
require('./routes')(app);

// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
  // NotificationDigest.run();
});

// Expose app
exports = module.exports = app;