'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    async = require('async'),
    _ = require('lodash');
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

var TenderSchema = new Schema({
    owner: {type: Schema.Types.ObjectId, ref: "User", required: true},
    // owner type maybe architects, builders or clients
    ownerType: String,
    project: {type: Schema.Types.ObjectId, ref: "Project", required: true},
    members: [{
        user: {type: Schema.Types.ObjectId, ref: "User"},
        email: String,
        activities: [{
            user: {type: Schema.Types.ObjectId, ref: "User", required: true},
            type: {type: String}, 
            createdAt: Date, 
            element: {}
        }]
    }],
    name: String,
    description: String,
    dateEnd: Date,
    // type maybe a subcontractors, builders or consultants
    type: String,
    // status is open, close
    status: {type: String, default: "open"},
    winner: {_id: {type: Schema.Types.ObjectId, ref: "User"}, email: String},
    element: {},
    activities: [{
        user: {type: Schema.Types.ObjectId, ref: "User", required: true},
        type: {type: String}, 
        createdAt: Date, 
        acknowledgeUsers: [{
            _id: {type: Schema.Types.ObjectId, ref: "User"},
            email: String,
            isAcknow: Boolean,
        }],
        element: {}
    }],
    isDistribute: {type: Boolean, default: false},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

TenderSchema.pre('save', function(next) {
    this.wasNew = this.isNew;
    this.editUser = this._editUser;
    this.evtName = this._evtName;
    next();
});

TenderSchema.post('save', function (doc) {
    doc.editUser = this.editUser;
    if (this.evtName ) {
        var evtName = this.evtName;
    } else {
        var evtName = this.wasNew ? 'Tender.Inserted' : 'Tender.Updated';
    }

    EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('Tender', TenderSchema);