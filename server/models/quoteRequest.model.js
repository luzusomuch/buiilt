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
  package: { type: Schema.Types.ObjectId },
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

QuoteRequestSchema
.pre('save', function(next) {
  this.wasNew = this.isNew;

  if (!this.isNew){
    this.updatedAt = new Date();
  }

  next();
});

QuoteRequestSchema.post('save', function (doc) {
  var evtName = this.wasNew ? 'Quote.Inserted' : 'Quote.Updated';
  EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('QuoteRequestSchema', QuoteRequestSchema);