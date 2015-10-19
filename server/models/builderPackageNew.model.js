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

var BuilderPackageNewVersionSchema = new Schema({
    dateStart: {type: Date, default: Date.now},
    quoteSend: {type: Number},
    isSendQuote: {type: Boolean, default: false},
    owner : {
        type : Schema.Types.ObjectId,
        ref : 'User',
        require : true,
    },
    ownerType: {type: String},
    location: location,
    to : {
        team : {
            type : Schema.Types.ObjectId,
            ref : 'User'
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
            ref: 'User'
        },
        to: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        sendBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        message: {type: String},
        sendAt: {type: Date}
    }],
    invitees: [{
        email: String,
        phoneNumber: Number,
        _id: {type: Schema.Types.ObjectId, ref: 'User'},
        isDecline: {type: Boolean, default: false},
        quoteDocument: [{type: Schema.Types.ObjectId, ref: 'File'}]
    }],
    newInvitees: [{
        _id: {type: Schema.Types.ObjectId, ref: 'User'},
        email: String,
        phoneNumber:Number
    }],
    winner: {
        type: Schema.Types.ObjectId, ref: 'User'
    },
    hasWinner: {
        type: Boolean, default: false
    },
    hasTempWinner: {
        type: Boolean, default: false
    },
    architect: {
        _id:{type: Schema.Types.ObjectId, ref: 'User'},
        email: String
    },
    projectManager: {
        _id:{type: Schema.Types.ObjectId, ref: 'User'},
        type: {type:String},
        email: {type: String}
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

BuilderPackageNewVersionSchema.plugin(packagePlugin);

BuilderPackageNewVersionSchema.pre('save', function(next) {
  this._modifiedPaths = this.modifiedPaths();
  this.editUser = this._editUser;
  this.ownerUser = this._ownerUser;
  next();
});

BuilderPackageNewVersionSchema.post('save', function(doc) {
  var evtName = this.wasNew ? 'BuilderPackageNewVersion.Inserted' : 'BuilderPackageNewVersion.Updated';
  if (this._modifiedPaths) {
    doc._modifiedPaths = this._modifiedPaths
  }
  doc.ownerUser = this._ownerUser;
  doc.editUser = this._editUser;

  EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('BuilderPackageNewVersion', BuilderPackageNewVersionSchema);