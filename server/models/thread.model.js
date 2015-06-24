'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  async = require('async'),
  _ = require('lodash');
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

/**
 * put your comment there...
 *
 * @type Schema
 */

var MessageSchema = new Schema({
  user : {
    type : Schema.Types.ObjectId,
    ref : 'User'
  },
  text : String
},{_id : false});

var ThreadSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  owner : {
    type : Schema.Types.ObjectId,
    ref : 'User',
    required : true
  },
  project : {
    type : Schema.Types.ObjectId,
    ref : 'Project',
    required : true
  },
  package : {
    type : Schema.Types.ObjectId,
    ref : 'Project',
    required : true
  },
  type : {
    type : String,
    enum : ['material','staff','contractor','builder'],
    required : true,
  },
  users : [{
    type : Schema.Types.ObjectId,
    ref : 'User'
  }],
  messages : [MessageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  strict: true,
  minimize: false
});

/**
 * Pre-save hook
 */
ThreadSchema.pre('save', function (next) {
  next();
});

/**
 * Load group by id
 * @param {type} id
 * @param {type} cb
 * @returns {undefined}
 */
ThreadSchema.statics.load = function (id, cb) {
  this.findOne({
    _id: id
  }).exec(cb);
};


ThreadSchema
  .pre('save', function(next) {
    this.wasNew = this.isNew;
    next();
  });

ThreadSchema.post('save', function (doc) {
  var evtName = this.wasNew ? 'Thread.Inserted' : 'Thread.Updated';

  EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('Thread', ThreadSchema);