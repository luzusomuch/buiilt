'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

var PeopleSchema = new Schema({
    type: {type: String, default: 'people'},
    project: {type: Schema.Types.ObjectId, ref: 'Project'},
    builders: [{
        _id: {type: Schema.Types.ObjectId, ref: 'User'},
        email: {type: String}
    }],
    architects: [{
        _id: {type: Schema.Types.ObjectId, ref: 'User'},
        email: {type: String}
    }],
    clients: [{
        _id: {type: Schema.Types.ObjectId, ref: 'User'},
        email: {type: String}
    }],
    subcontractors: [{
        _id: {type: Schema.Types.ObjectId, ref: 'User'},
        email: {type: String}
    }],
    consultants: [{
        _id: {type: Schema.Types.ObjectId, ref: 'User'},
        email: {type: String}
    }]
});

PeopleSchema
.pre('save', function(next) {
    this.wasNew = this.isNew;
    this.editUser = this._editUser;
    this.newInvitee = this._newInvitee;
    this.newInviteType = this._newInviteType;
    this._modifiedPaths = this.modifiedPaths();
    if (!this.isNew){
        this.updatedAt = new Date();
    }

    next();
});

PeopleSchema.post('save', function (doc) {
    var evtName = this.wasNew ? 'People.Inserted' : 'People.Updated';
    if (this._modifiedPaths) {
        doc._modifiedPaths = this._modifiedPaths
    }
    doc.editUser = this._editUser;
    doc.newInvitee = this._newInvitee;
    doc.newInviteType = this._newInviteType;
    EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('People', PeopleSchema);