'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

var QuoteRequestSchema = new Schema({
  //who submit the request
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  //home owner email
  email: { type: String },
  description: {
    type: String,
    default: ''
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: 'Project is required'
  },
  quoteRate: [{
    description: {type: String},
    rate: {type: Number},
    quantity: {type: Number},
    total: {type: Number}
  }],
  quotePrice: [{
    description: {type: String},
    price: {type: Number},
    quantity: {type: Number},
    total: {type: Number}
  }],
  subTotal: {type: Number},
  file: {type: Schema.Types.ObjectId, ref:'File'},
  //the quote type: ex - quote from home owner to home builder
  //quote for the package
  type: {type: String, default: ''},
  package: { type: Schema.Types.ObjectId },
  packageType: {type: String, default: 'builder'},
  total: { type: Number },
  //update status after home owner / home builder... selects the quotes
  status: {
    type: String,
    enum: ['pending', 'selected', 'cancelled', 'closed'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
},{
  strict: true,
  minimize: false
});

QuoteRequestSchema
.pre('save', function(next) {
  this.wasNew = this.isNew;

  if (!this.isNew){
    this.updatedAt = new Date();
  }

  next();
});

QuoteRequestSchema.post('save', function (doc) {
  var evtName = this.wasNew ? 'QuoteRequest.Inserted' : 'QuoteRequest.Updated';
  EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('QuoteRequest', QuoteRequestSchema);
