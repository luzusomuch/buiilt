'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

var RequestedHomeBuilder = {
  //id of home buider
  _id: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  email: {
    type: String
  },
  phoneNumber: {
    type: String
  }
};

var ProjectSchema = new Schema({
  //creator, this is home owner
  user: {
    _id : {type: Schema.Types.ObjectId, ref: 'User', required: true},
    name : {type: String, default: ' '}
  },
  name: {
    type: String,
    default: '',
    required: 'Name is required'
  },
  description: {
    type: String,
    default: ''
  },
  //the quote after selecting home builders
  quote: {type: Number},
  //selected home builder
  homeBuilder: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  //winner email
  email : {type: String},
  requestedHomeBuilders: [RequestedHomeBuilder],
  location: {
    address: {
      type: String,
      default: '',
      required: 'Address is required'
    },
    //lat / lon base on address
    geo: {type: [Number], default: [0, 0], index: '2dsphere'},
    postcode: {type: String, default: ''},
    city: {type: String, default: ''},
    suburb: {type: String, default: ''}
  },
  status: {
    type: String,
    enum: ['open', 'close'],
    default: 'open'
  },
  //TODO - store subscription data
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
},{
  strict: true,
  minimize: false
});

/**
 * Virtuals
 */
ProjectSchema
  .virtual('dateStart')
  .set(function(dateStart) {
    this._dateStart = dateStart;
  })
  .get(function() {
    return this._dateStart;
  });

/**
 * Pre-save hook
 */
ProjectSchema
.pre('save', function(next) {
  this.wasNew = this.isNew;

  if (!this.isNew){
    this.updatedAt = new Date();
  }

  next();
});

ProjectSchema.post('save', function (doc) {
  var evtName = this.wasNew ? 'Project.Inserted' : 'Project.Updated';

  EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('Project', ProjectSchema);
