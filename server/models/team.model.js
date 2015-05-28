'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  async = require('async'),
  _ = require('lodash');

/**
 * put your comment there...
 *
 * @type Schema
 */
var TeamSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: 'Team type is required'
  },
  //creator
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
TeamSchema.pre('save', function (next) {
  next();
});

/**
 * Load group by id
 * @param {type} id
 * @param {type} cb
 * @returns {undefined}
 */
TeamSchema.statics.load = function (id, cb) {
  this.findOne({
    _id: id
  }).exec(cb);
};

module.exports = mongoose.model('Team', TeamSchema);