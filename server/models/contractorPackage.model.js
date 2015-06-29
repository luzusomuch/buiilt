'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

var ContractorPackageSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  type: String,
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  packageInviteToken: String,
  name: String,
  descriptions: [String],
  category: String,
  addendums: [{
    description: String,
    addendumsScope: [{
      description: String,
      quantity: Number
    }],
    isHidden: {type: Boolean, default: false}
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
      ref: 'Team'
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: 'Team'
    },
    message: {type: String}
  }],
  to: [{
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'Team'
    },
    email: {
      type: String
    },
    phoneNumber: {
      type: Number
    },
    quote: {type: Schema.Types.ObjectId, ref: 'QuoteRequest'}
  }],
  newInvitation: [{
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'Team'
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
  isCancel: {type: Boolean, default: false},
  isAccept: { type: Boolean, default: false },
  status: { type: Boolean, default: true },
  dateStart: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

/**
 * Pre-save hook
 */
ContractorPackageSchema.post( 'init', function() {
  this._original = this.toJSON();
});

ContractorPackageSchema
.pre('save', function(next) {
  this._modifiedPaths = this.modifiedPaths();
  this.wasNew = this.isNew;
  this.editUser = this._editUser;
  this.ownerUser = this._ownerUser;
  this.quote = this._quote;
  if (!this.isNew){
    this.updatedAt = new Date();
  } else {
    this.packageInviteToken = crypto.randomBytes(20).toString('hex');
  }
  next();
});

ContractorPackageSchema.post('save', function (doc) {
  var evtName = this.wasNew ? 'ContractorPackage.Inserted' : 'ContractorPackage.Updated';
  if (this._modifiedPaths) {
    doc._modifiedPaths = this._modifiedPaths
  }
  if (this._original) {
    doc._oldContractor = this._original.to.slice(0);
    doc._newInvitation = this._original.newInvitation.slice(0);
    doc._oldAddendum = this._original.addendums.slice(0);
  }
  doc.ownerUser = this._ownerUser;
  doc.editUser = this._editUser;
  doc.quote = this._quote;
  EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('ContractorPackage', ContractorPackageSchema);
