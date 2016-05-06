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
    event: {type: Schema.Types.ObjectId, ref: "Activity"},
    isCreateScope: {type: Boolean, default: false},
    documentSet: {type: Schema.Types.ObjectId, ref: "Document"},
    members: [{
        user: {type: Schema.Types.ObjectId, ref: "User"},
        email: String,
        name: String,
        phoneNumber: String,
        activities: [{
            user: {type: Schema.Types.ObjectId, ref: "User", required: true},
            email: String,
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
    this.newInvitees = this._newInvitees;
    this._modifiedPaths = this.modifiedPaths();
    this.evtName = this._evtName;
    next();
});

TenderSchema.post('save', function (doc) {
    doc.editUser = this.editUser;
    doc.newInvitees = this.newInvitees;
    if (this._modifiedPaths) {
        doc._modifiedPaths = this._modifiedPaths
    }
    if (this.evtName ) {
        var evtName = this.evtName;
    } else {
        var evtName = this.wasNew ? 'Tender.Inserted' : 'Tender.Updated';
    }

    EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('Tender', TenderSchema);