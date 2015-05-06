var winston = require('winston'),
    config = require('./../config/environment'),
    _ = require('lodash'),
    expressWinston = require('express-winston'),
    isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development',
    logger,
    transports = [
      new (winston.transports.Console)({colorize: true, prettyPrint: true})
    ];

require('winston-logentries');

if (config.logentries.token) {
  transports.push(new (winston.transports.Logentries)({
    token: config.logentries.token,
    prettyPrint: true
  }));
}

logger = new (winston.Logger)({
  exitOnError: false,
  transports: transports
});

logger.requestsLogger = expressWinston.logger({
  transports: transports,
  meta: false,
  msg: isDevelopment ? '{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}' : 'HTTP {{req.method}} {{req.url}}'
});

logger.errorLogger = expressWinston.errorLogger({
  transports: transports,
  dumpExceptions: true,
  showStack: true
});

module.exports = logger;
