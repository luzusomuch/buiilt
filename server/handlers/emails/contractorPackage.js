/**
 * Broadcast updates to client when the model changes
 */
var _ = require('lodash');
'use strict';

var Mailer = require('./../../components/Mailer');
var EventBus = require('./../../components/EventBus');
var Project = require('./../../models/project.model');
var User = require('./../../models/user.model');
var ContractorPackage = require('./../../models/contractorPackage.model');
var config = require('./../../config/environment');
var async = require('async');

/**
 * event handler after creating new quote
 */
 //contractor-package-request.html
EventBus.onSeries('ContractorPackage.Inserted', function(request, next) {
    console.log(request);
  async.parallel({
    user: function(cb){
      User.findOne({_id: request.owner}, cb);
    },
    project: function(cb){
      //find project
      Project.findOne({_id: request.project}, cb);
    }
  }, function(err, result){
    if (!err) {
      console.log(result);
      //do send email
      _.each(request.to,function(toEmail, err) {
        if (err) {console.log(err);}
        else {
            Mailer.sendMail('contractor-package-request.html', toEmail.email, {
            contractorPackage: request,
            //project owner
            user: result.user,
            project: result.project,
            contractorPackageLink: config.baseUrl + 'contractor-requests/' + request._id,
            subject: 'Quote request for ' + request.name
        }, function(err) {
                return next();
            });
        }
      });
    } else {
      return next();
    }
  });
});