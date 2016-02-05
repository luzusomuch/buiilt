/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');

module.exports = function(app) {

  // Insert routes below
  app.use('/api/users', require('./api/user'));
  app.use('/api/contractors', require('./api/contractors'));
  app.use('/api/materials', require('./api/material'));
  app.use('/api/projects', require('./api/project'));
  app.use('/api/quotes', require('./api/quote'));
  app.use('/api/quoteRequests', require('./api/quoteRequest'));
  app.use('/api/contractorRequests', require('./api/contractorRequest'));
  app.use('/api/materialRequests', require('./api/materialRequest'));
  app.use('/api/packageInvites', require('./api/packageInvite'));
  app.use('/api/registryForContractors', require('./api/registryForContractor'));
  app.use('/api/uploads', require('./api/upload'));
  app.use('/api/tasks', require('./api/task'));
  app.use('/api/teams', require('./api/team'));
  app.use('/api/invite-token', require('./api/inviteToken'));
  app.use('/api/packages', require('./api/package'));
  app.use('/api/packages/builders', require('./api/package/builder'));
  app.use('/api/packages/staff', require('./api/package/staff'));
  app.use('/api/documents', require('./api/document'));
  app.use('/api/files', require('./api/files'));
  app.use('/api/validateInvites', require('./api/validateInvite'));
  app.use('/api/notifications', require('./api/notification'));
  app.use('/api/messages', require('./api/message'));
  app.use('/api/addOnPackages', require('./api/addOnPackage'));
  app.use('/api/variationRequests', require('./api/variationRequest'));
  app.use('/api/devices', require('./api/device'));
  app.use('/api/designs', require('./api/design'));
  app.use('/api/peoples', require('./api/people'));
  app.use('/api/peopleChats', require('./api/peopleChat'));
  app.use('/api/boards', require('./api/board'));
  app.use('/api/tenders', require('./api/tender'));

  app.use('/auth', require('./auth'));

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
   .get(errors[404]);
   app.route('/backend/*')
    .get(function(req, res) {
      res.sendfile(app.get('appPath') + '/backend.html')
    });
    app.route('/')
    .get(function(req, res) {
      res.sendfile(app.get('appPath') + '/home.html')
    });
  // All other routes should redirect to the index.html



  app.route('/*')
    .get(function(req, res) {
      res.sendfile(app.get('appPath') + '/index.html');
    });
};
