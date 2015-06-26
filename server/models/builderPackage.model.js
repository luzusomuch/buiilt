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
      enum : ['homeowner','builder']
    }
  },
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
  next();
});

BuilderPackageSchema.post('save', function(doc) {
  var evtName = this.wasNew ? 'BuilderPackage.Inserted' : 'BuilderPackage.Updated';

  EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('BuilderPackage', BuilderPackageSchema);
