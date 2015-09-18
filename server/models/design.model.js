'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

var DesignSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  name: String,
  descriptions: [String],
  type: {type: String},
  invitees :[{
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

DesignSchema.pre('save', function(next) {
  this._modifiedPaths = this.modifiedPaths();
  this.editUser = this._editUser;
  this.ownerUser = this._ownerUser;
  next();
});

DesignSchema.post('save', function(doc) {
  var evtName = this.wasNew ? 'Design.Inserted' : 'Design.Updated';
  if (this._modifiedPaths) {
    doc._modifiedPaths = this._modifiedPaths
  }
  doc.ownerUser = this._ownerUser;
  doc.editUser = this._editUser;

  EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('Design', DesignSchema);
