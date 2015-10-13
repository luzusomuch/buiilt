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
  text : String,
  sendAt : {type : Date, default: Date.now()}
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
    enum : ['material','staff','contractor','builder','variation','design'],
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
  },
  isNewNotification: {
    type: Boolean
  }
}, {
  strict: true,
  minimize: false
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

ThreadSchema.post( 'init', function() {
  this._original = this.toJSON();
});

ThreadSchema.pre('save', function(next) {
    this.wasNew = this.isNew;
    this.editUser = this._editUser;
    this.evtName = this._evtName;
    this.message = this._message;
    this.isNewNotification = this._isNewNotification;
    next();
  });

ThreadSchema.post('save', function (doc) {
  if (this._original) {
    doc.oldUsers = this._original.users.slice();
  }
  doc.editUser = this.editUser;
  doc.message = this.message;
  doc.isNewNotification = doc.isNewNotification;
  if (this.evtName ) {
    var evtName = this.evtName;
  } else {
    var evtName = this.wasNew ? 'Thread.Inserted' : 'Thread.Updated';
  }

  EventBus.emit(evtName, doc);
});

// ThreadSchema.methods.toJSON = function() {
//   return {
//     _id: this._id,
//     name: this.name,
//     owner: this.owner,
//     project: this.project,
//     package: this.package,
//     type: this.type,
//     users: this.users,
//     updatedAt: this.updatedAt,
//     createdAt: this.createdAt
//   };
// };

module.exports = mongoose.model('Thread', ThreadSchema);