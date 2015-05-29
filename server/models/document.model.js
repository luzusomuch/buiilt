'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');



var DocumentSchema = new Schema({
  //creator
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  package: {
    type: Schema.Types.ObjectId
  },
  name: String,
  description: String,
  version: String,
  //TODO - define package ID and related data
  
  file: {
    type: Schema.Types.ObjectId,
    ref: 'File'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
},{
  strict: true,
  minimize: false
});

module.exports = mongoose.model('Document', DocumentSchema);
