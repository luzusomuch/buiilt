/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');

module.exports = function(app) {

  // Insert routes below
  app.use('/api/users', require('./api/user'));
  app.use('/api/projects', require('./api/project'));
  app.use('/api/packageInvites', require('./api/packageInvite'));
  app.use('/api/uploads', require('./api/upload'));
  app.use('/api/tasks', require('./api/task'));
  app.use('/api/teams', require('./api/team'));
  app.use('/api/invite-token', require('./api/inviteToken'));
  app.use('/api/files', require('./api/files'));
  app.use('/api/validateInvites', require('./api/validateInvite'));
  app.use('/api/notifications', require('./api/notification'));
  app.use('/api/messages', require('./api/message'));
  app.use('/api/devices', require('./api/device'));
  app.use('/api/peoples', require('./api/people'));
  app.use('/api/tenders', require('./api/tender'));

  app.use('/auth', require('./auth'));

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*').get(errors[404]);
  app.route('/backend/*').get(function(req, res) {
    res.sendfile(app.get('appPath') + '/backend.html')
  });
  app.route('/home').get(function(req, res) {
    res.sendfile(app.get('appPath') + '/home.html')
  });
  // All other routes should redirect to the index.html
  app.route('/*').get(function(req, res) {
    res.sendfile(app.get('appPath') + '/index.html');
  });
};
