/**
 * Broadcast updates to client when the model changes
 */
var _ = require('lodash');
'use strict';

var Mailer = require('./../../components/Mailer');
var EventBus = require('./../../components/EventBus');
var Project = require('./../../models/project.model');
var Team = require('./../../models/team.model');
var User = require('./../../models/user.model');
var MaterialPackage = require('./../../models/materialPackage');
var config = require('./../../config/environment');
var async = require('async');

/**
 * event handler after creating new quote
 */
 //contractor-package-request.html
EventBus.onSeries('MaterialPackage.Inserted', function(request, next) {
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
        _.each(request.to, function(supplier) {
            Team.findOne({'groupUser.email': supplier.email}).populate('user').exec(function(err,team){
                if (err) {return res.send(500,err);}
                if (!team) {return res.send(404, err);}
                else {
                    Mailer.sendMail('supplier-package-send-quote.html', team.user.email, {
                        materialPackage: request,
                        user: result.user,
                        project: result.project,
                        link: config.baseUrl + 'material-request/' + request._id,
                        subject: 'Quote request for ' + request.name
                    }, function(err) {
                        return next();
                    });    
                }
            });
        });
    } else {
      return next();
    }
  });
});