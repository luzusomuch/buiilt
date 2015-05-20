/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var BuilderPackage = require('./../models/builderPackage.model');

/**
 * event handler after creating new account
 */
EventBus.onSeries('Project.Inserted', function(project, next) {
  //create a bulder package
  var builderPackage = new BuilderPackage({
    name: project.name + ' builder package',
    description: project.description,
    dateStart: project.dateStart,
    user: project.user,
    project: project._id,
    type: 'BuilderPackage'
  });

  builderPackage.save(function(err, data){
    return next();
  });
});