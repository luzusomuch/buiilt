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

var TeamInviteSchema = new Schema({
  team: {
    type: Schema.Types.ObjectId,
    ref : 'Team',
    required: true
  },
  teamInviteToken : String,
  email : String,
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
TeamInviteSchema.pre('save', function (next) {
  next();
});

/**
 * Load group by id
 * @param {type} id
 * @param {type} cb
 * @returns {undefined}
 */
TeamInviteSchema.statics.load = function (id, cb) {
  this.findOne({
    _id: id
  }).exec(cb);
};

TeamInviteSchema
  .pre('save', function(next) {
    this.wasNew = this.isNew;

    if (!this.isNew){
      this.updatedAt = new Date();
    } else {
      this.teamInviteToken = crypto.randomBytes(20).toString('hex');
    }

    next();
  });

//TeamInviteSchema.post('save', function (doc) {
//  var evtName = this.wasNew ? 'Team.Inserted' : 'Team.Updated';
//
//  EventBus.emit(evtName, doc);
//});

module.exports = mongoose.model('TeamInvite', TeamInviteSchema);