'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var packagePlugin = require('./plugins/package');
var EventBus = require('./../components/EventBus');

var location = {
  address: {
    type: String,
    default: ''
  },
  //lat / lon base on address
  geo: {type: [Number], default: [0, 0], index: '2dsphere'},
  postcode: {type: String, default: ''},
  city: {type: String, default: ''},
  suburb: {type: String, default: ''}
};

var TeamSchema = new Schema({
  team : {
    type : Schema.Types.ObjectId,
    ref : 'Team'
  },
  email : String
},{_id : false});

var BuilderPackageSchema = new Schema({
  dateStart: {type: Date, default: Date.now},
  //the quote send to home owner
  quoteSend: {type: Number},
  //status of quote
  //when user login to the project, we will check default package to get default page base o this field
  isSendQuote: {type: Boolean, default: false},
  //home owner email
  homeOwnerEmail: {type: String},
  homeOwnerPhoneNumber: {type: String},
  owner : {
    type : Schema.Types.ObjectId,
    ref : 'Team',
    require : true
  },
  location: location,
  to : {
    team : {
      type : Schema.Types.ObjectId,
      ref : 'Team'
    },
    email : String,
    type : {
      type : String,
      enum : ['homeOwner','builder']
    }
  },
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
    message: {type: String}
  }],
  invitees: [{
    email: String,
    phoneNumber: Number,
    _id: {type: Schema.Types.ObjectId, ref: 'Team'},
    isDecline: {type: Boolean, default: false},
    quoteDocument: [{type: Schema.Types.ObjectId, ref: 'File'}]
  }],
  newInvitees: [{
    _id: {type: Schema.Types.ObjectId, ref: 'Team'},
    email: String,
    phoneNumber:Number
  }],
  winner: {
    type: Schema.Types.ObjectId, ref: 'Team'
  },
  hasWinner: {
    type: Boolean, default: false
  },
  architect: {
    team:{type: Schema.Types.ObjectId, ref: 'Team'},
    email: String
  },
  hasArchitectManager: {type: Boolean, default: false},
  variations : [{type: Schema.Types.ObjectId, ref: 'Variation'}],
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
});

BuilderPackageSchema.plugin(packagePlugin);

BuilderPackageSchema.pre('save', function(next) {
  this._modifiedPaths = this.modifiedPaths();
  this.editUser = this._editUser;
  this.ownerUser = this._ownerUser;
  next();
});

BuilderPackageSchema.post('save', function(doc) {
  var evtName = this.wasNew ? 'BuilderPackage.Inserted' : 'BuilderPackage.Updated';
  if (this._modifiedPaths) {
    doc._modifiedPaths = this._modifiedPaths
  }
  doc.ownerUser = this._ownerUser;
  doc.editUser = this._editUser;

  EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('BuilderPackage', BuilderPackageSchema);
