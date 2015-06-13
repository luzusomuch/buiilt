'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

var ContractorPackageSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
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
  newInvitation: [{
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
  winner: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    email: {
      type: String
    }
  },
  quote: {
    type: Number,
    // required: true
  },
  defact:[],
  isAccept: { type: Boolean, default: false },
  status: { type: Boolean, default: true },
  dateStart: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

/**
 * Pre-save hook
 */
ContractorPackageSchema
.pre('save', function(next) {
  this.wasNew = this.isNew;

  if (!this.isNew){
    this.updatedAt = new Date();
  }

  next();
});

ContractorPackageSchema.post('save', function (doc) {
  var evtName = this.wasNew ? 'ContractorPackage.Inserted' : 'ContractorPackage.Updated';

  EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('ContractorPackage', ContractorPackageSchema);
