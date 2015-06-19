'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

var MaterialPackageSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: String,
  description: String,
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  winnerTeam: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'Team'
    }
  },
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
  requirements: [{
    description: {
      type: String
    },
    quantity: {
      type: Number
    }
  }],
  quote: {
    type: Number,
    // required: true
  },
  defact:[],
  isSelect: { type: Boolean, default: false },
  status: { type: Boolean, default: true },
  dateStart: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

MaterialPackageSchema
.pre('save', function(next) {
  this.wasNew = this.isNew;

  if (!this.isNew){
    this.updatedAt = new Date();
  }

  next();
});

MaterialPackageSchema.post('save', function (doc) {
  var evtName = this.wasNew ? 'MaterialPackage.Inserted' : 'MaterialPackage.Updated';

  EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('MaterialPackage', MaterialPackageSchema);
