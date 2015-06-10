var _ = require('lodash');
'use strict';

var Mailer = require('./../../components/Mailer');
var EventBus = require('./../../components/EventBus');
var Project = require('./../../models/project.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var ContractorPackage = require('./../../models/contractorPackage.model');
var User = require('./../../models/user.model');
var config = require('./../../config/environment');
var async = require('async');

EventBus.onSeries('Team.Inserted', function(request, next){
    async.each(request.member, function(user,callback) {
      if (!user.user) {
          Mailer.sendMail('invite-team-has-no-account.html', user.email, {
              request: request,
              link: config.baseUrl + 'signup',
              subject: 'Group invitation ' + request.name
          }, function(err) {
            callback()
          });
      } else  {
         callback()
      }
    },function() {
      next();
    });
});