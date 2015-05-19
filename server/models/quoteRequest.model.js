'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

var QuoteSchema = new Schema({
  //who submit the request
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: 'Project is required'
  },
  //the quote type: ex - quote from home owner to home builder
  //quote for the package
  type: {type: String, default: ''},
  package: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      //TODO - should define all package type here
      enum: ['Builder', 'Material', 'Contractor']
    }
  },
  price: { type: Number },
  //update status after home owner / home builder... selects the quotes
  status: {
    type: String,
    enum: ['pending', 'selected', 'cancelled', 'closed']
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
},{
  strict: true,
  minimize: false
});
module.exports = mongoose.model('Quote', QuoteSchema);
