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
  packageType: String,
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  packageInviteToken: String,
  name: String,
  description: String,
  category: String,
  addendums: [{
    description: String,
    addendumsScope: [{
      description: String,
      quantity: Number
    }]
  }],
  variations : [{
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    title: {type: String},
    description: {type: String}
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
  messages: [{
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    message: {type: String}
  }],
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
  winnerTeam: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'Team'
    }
  },
  quote: {
    type: Number,
    // required: true
  },
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
  } else {
    this.packageInviteToken = crypto.randomBytes(20).toString('hex');
  }

  next();
});

ContractorPackageSchema.post('save', function (doc) {
  var evtName = this.wasNew ? 'ContractorPackage.Inserted' : 'ContractorPackage.Updated';

  EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('ContractorPackage', ContractorPackageSchema);
