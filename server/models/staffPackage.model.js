'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

var StaffPackageSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: String,
  description: String,
  to: [{
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    email: {
      type: String
    },
    phoneNumber: {
      type: Number
    }
  }],
  staffowner :{ 
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  defact:[],
  isComplete: { type: Boolean, default: false },
  status: { type: Boolean, default: true },
  dateStart: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('StaffPackage', StaffPackageSchema);
