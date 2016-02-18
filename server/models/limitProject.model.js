'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

var LimitProjectSchema = new Schema({
  //owner of project
  number: {type: Number, default: 1},
  //TODO - store subscription data
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
},{
  strict: true,
  minimize: false
});

/**
 * Pre-save hook
 */
LimitProjectSchema
.pre('save', function(next) {
  this.wasNew = this.isNew;

  if (!this.isNew){
    this.updatedAt = new Date();
  }

  next();
});

LimitProjectSchema.post('save', function (doc) {
  var evtName = this.wasNew ? 'LimitProject.Inserted' : 'LimitProject.Updated';

  EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('LimitProject', LimitProjectSchema);
