'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

var ProjectSchema = new Schema({
  //owner of project
  owner: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  name: {
    type: String,
    default: '',
    required: 'Name is required'
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['open', 'close', 'waiting', 'archive'],
    default: 'open'
  },
  projectManager: {
    _id: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    type: {type: String}
  },
  address: {
    type: String,
    default: ''
  },
  suburb: {type: String, default: ''},
  postcode: {type: String, default: ''},
  //TODO - store subscription data
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
},{
  strict: true,
  minimize: false
});

/**
 * Virtuals
 */
ProjectSchema
  .virtual('dateStart')
  .set(function(dateStart) {
    this._dateStart = dateStart;
  })
  .get(function() {
    return this._dateStart;
  });

/**
 * Pre-save hook
 */
ProjectSchema
.pre('save', function(next) {
  this.wasNew = this.isNew;

  if (!this.isNew){
    this.updatedAt = new Date();
  }

  next();
});

ProjectSchema.post('save', function (doc) {
  var evtName = this.wasNew ? 'Project.Inserted' : 'Project.Updated';

  EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('Project', ProjectSchema);
