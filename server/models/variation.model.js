'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

var VariationSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  package: {
    type: Schema.Types.ObjectId,
    required: true
  },
  packageType: String,
  type: String,
  name: String,
  description: [String],
  defects : [{
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    title: {type: String},
    location: {type: String},
    description: {type: String}
  }],
  messages: [{
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'Team'
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: 'Team'
    },
    message: {type: String}
  }],
  to: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'Team'
    },
    quote: {type: Schema.Types.ObjectId, ref: 'QuoteRequest'},
    isSelect: {type: Boolean, default: false}
  },
  addendums: [{
    description: String,
    addendumsScope: [{
      description: String,
      quantity: Number
    }],
    isHidden: {type: Boolean, default: false}
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
  defact:[],
  isCancel: {type: Boolean, default: false},
  isAccept: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
  dateStart: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

/**
 * Pre-save hook
 */
VariationSchema.post( 'init', function() {
  this._original = this.toJSON();
});

VariationSchema
.pre('save', function(next) {
  this._modifiedPaths = this.modifiedPaths();
  this.wasNew = this.isNew;
  this.editUser = this._editUser;
  this.ownerUser = this._ownerUser;
  this.quote = this._quote;
  if (!this.isNew){
    this.updatedAt = new Date();
  }
  next();
});

VariationSchema.post('save', function (doc) {
  var evtName = this.wasNew ? 'VariationSchema.Inserted' : 'VariationSchema.Updated';
  if (this._modifiedPaths) {
    doc._modifiedPaths = this._modifiedPaths
  }
  doc.ownerUser = this._ownerUser;
  doc.editUser = this._editUser;
  doc.quote = this._quote;
  EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('Variation', VariationSchema);
