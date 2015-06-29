'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');
var packagePlugin = require('./plugins/package');

var StaffPackageSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  name: String,
  descriptions: [String],
  staffs :[{
    type: Schema.Types.ObjectId,
    ref: 'User'
    //required: true
  }],
  defects : [{
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    title: {type: String},
    location: {type: String},
    description: {type: String}
  }],
  invoices: [{
    owner: {type: Schema.Types.ObjectId, ref: 'User'},
    title: String,
    quoteRate: [{
      description: {type: String},
      rate: {type: Number},
      quantity: {type: Number},
      subTotal: {type: Number},
      total: {type: Number}
    }],
    quotePrice: [{
      description: {type: String},
      price: {type: Number},
      quantity: {type: Number},
      total: {type: Number}
    }],
    total: Number
  }],
  defect:[],
  isCompleted: { type: Boolean, default: false },
  status: { type: Boolean, default: true },
  dateStart: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
StaffPackageSchema.plugin(packagePlugin);
module.exports = mongoose.model('StaffPackage', StaffPackageSchema);
