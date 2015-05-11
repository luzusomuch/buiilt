'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

var BuilderPackageSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: String,
  description: String,
  homeowner :{ 
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projects: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  quote: {
    type: Schema.Types.ObjectId,
    ref: 'Quote',
    required: true
  },
  defact:[],
  isAccept: { type: Boolean, default: false },
  status: { type: Boolean, default: true },
  dateStart: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('BuilderPackage', BuilderPackageSchema);
