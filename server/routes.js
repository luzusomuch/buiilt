/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');

module.exports = function(app) {

  // Insert routes below
  app.use('/api/users', require('./api/user'));
  app.use('/api/contractors', require('./api/contractors'));
  app.use('/api/projects', require('./api/project'));
  app.use('/api/quotes', require('./api/quote'));
  app.use('/api/quoteRequests', require('./api/quoteRequest'));
  app.use('/api/uploads', require('./api/upload'));
  app.use('/api/teams', require('./api/team'));
  app.use('/api/packages', require('./api/package'));
  app.use('/api/packages/builders', require('./api/package/builder'));
  app.use('/api/documents', require('./api/document'));
  app.use('/api/files', require('./api/files'));
  app.use('/auth', require('./auth'));


  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
   .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function(req, res) {
      res.sendfile(app.get('appPath') + '/index.html');
    });
};
