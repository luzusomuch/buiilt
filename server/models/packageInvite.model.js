'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

var PackageInviteSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: String,
  inviteType: String,
  package: { type: Schema.Types.ObjectId },
  project: { type: Schema.Types.ObjectId, ref: 'Project' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

PackageInviteSchema
.pre('save', function(next) {
  this.wasNew = this.isNew;

  if (!this.isNew){
    this.updatedAt = new Date();
  }

  next();
});

PackageInviteSchema.post('save', function (doc) {
  var evtName = this.wasNew ? 'PackageInvite.Inserted' : 'PackageInvite.Updated';

  EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('PackageInvite', PackageInviteSchema);