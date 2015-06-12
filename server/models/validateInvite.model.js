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

var ValidateInviteSchema = new Schema({
    email: {
        type: String
    },
    inviteType: {
        type: String
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
ValidateInviteSchema.pre('save', function (next) {
  next();
});

/**
 * Load group by id
 * @param {type} id
 * @param {type} cb
 * @returns {undefined}
 */
ValidateInviteSchema.statics.load = function (id, cb) {
  this.findOne({
    _id: id
  }).exec(cb);
};

module.exports = mongoose.model('ValidateInvite', ValidateInviteSchema);