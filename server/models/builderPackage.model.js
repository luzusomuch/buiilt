'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var packagePlugin = require('./plugins/package');
var EventBus = require('./../components/EventBus');

var BuilderPackageSchema = new Schema({
  dateStart: { type: Date, default: Date.now }
});

BuilderPackageSchema.plugin(packagePlugin);

BuilderPackageSchema.pre('save', function(next){
  this.type = 'BuilderPackage';

  next();
});

BuilderPackageSchema.post('save', function (doc) {
  var evtName = this.wasNew ? 'BuilderPackage.Inserted' : 'BuilderPackage.Updated';
  
  EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('BuilderPackage', BuilderPackageSchema);
