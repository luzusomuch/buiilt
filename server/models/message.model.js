'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

var MessageSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  from: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  to: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  message: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
},{ strict : false});
module.exports = mongoose.model('Message', MessageSchema);
