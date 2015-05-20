/**
 * Express configuration
 */

'use strict';

var express = require('express');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
var path = require('path');
var config = require('./environment');
var passport = require('passport');
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);
var mongoose = require('mongoose');
var loader = require('./loader');
var expressValidator = require('express-validator');
var logger = require('./../components/Logger');

module.exports = function(app) {
  var env = app.get('env');

  // Globbing model files
  loader.getGlobbedFiles('./server/models/**/*.js').forEach(function(modelPath) {
    require(path.resolve(modelPath));
  });

  //load the handler
  loader.getGlobbedFiles('./server/handlers/**/*.js').forEach(function(modelPath) {
    require(path.resolve(modelPath));
  });

  app.set('views', config.root + '/server/views');
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'html');
  app.use(compression());
  app.use(bodyParser.urlencoded({extended: false}));
  app.use(bodyParser.json());
  app.use(methodOverride());
  //express validator middleware
  app.use(expressValidator({
    customValidators: {
      isArray: function(value) {
        return Array.isArray(value);
      }
    }
  }));
  app.use(cookieParser());
  app.use(passport.initialize());

  //request loger
  app.use(logger.requestsLogger);
  // error handlers
  app.use(logger.errorLogger);

  // Persist sessions with mongoStore
  // We need to enable sessions for passport twitter because its an oauth 1.0 strategy
  app.use(session({
    secret: config.secrets.session,
    resave: true,
    saveUninitialized: true,
    store: new mongoStore({mongoose_connection: mongoose.connection})
  }));

  if ('production' === env) {
    app.use(favicon(path.join(config.root, 'public', 'favicon.ico')));
    app.use(express.static(path.join(config.root, 'public')));
    app.set('appPath', config.root + '/public');
    app.use(morgan('dev'));
  }

  if ('development' === env || 'test' === env) {
    app.use(require('connect-livereload')());
    app.use(express.static(path.join(config.root, '.tmp')));
    app.use(express.static(path.join(config.root, 'client')));
    app.set('appPath', 'client/app');
    app.use(morgan('dev'));
    app.use(errorHandler()); // Error handler - has to be last
  }
};