'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

var MaterialPackageSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  type: String,
  name: String,
  descriptions: [String],
  addendums: [{
    description: String,
    addendumsScope: {
      description: String,
      quantity: Number,
      scopeUpdated: { type: Date, default: Date.now},
    },
    isHidden: {type: Boolean, default: false},
    updated: { type: Date, default: Date.now}
  }],
  variations : [{type: Schema.Types.ObjectId, ref: 'Variation'}],
  messages: [{
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'Team'
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: 'Team'
    },
    sendBy: {
      type: Schema.Types.ObjectId,
      ref: 'Team'
    },
    message: {type: String},
    sendAt: {type: Date}
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
    },
    isDecline: {type: Boolean, default: false},
    quote: {type: Schema.Types.ObjectId, ref: 'QuoteRequest'},
    quoteDocument: [{type: Schema.Types.ObjectId, ref: 'File'}]
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
  isCancel: {type: Boolean, default: false},
  defact:[],
  isSkipInTender: {type: Boolean, default: false},
  isSelect: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
  dateStart: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

MaterialPackageSchema
.pre('save', function(next) {
  this.wasNew = this.isNew;
  this._modifiedPaths = this.modifiedPaths();
  this.editUser = this._editUser;
  this.ownerUser = this._ownerUser;
  this.quote = this._quote;
  if (!this.isNew){
    this.updatedAt = new Date();
  }

  next();
});

MaterialPackageSchema.post('save', function (doc) {
  var evtName = this.wasNew ? 'MaterialPackage.Inserted' : 'MaterialPackage.Updated';
  if (this._modifiedPaths) {
    doc._modifiedPaths = this._modifiedPaths
  }
  if (this._original) {
    doc._oldSupplier = this._original.to.slice(0);
    doc._newInvitation = this._original.newInvitation.slice(0);
    doc._oldAddendum = this._original.addendums.slice(0);
  }
  doc.ownerUser = this._ownerUser;
  doc.editUser = this._editUser;
  doc.quote = this._quote;
  EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('MaterialPackage', MaterialPackageSchema);
