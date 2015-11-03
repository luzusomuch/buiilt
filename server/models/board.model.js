'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

var BoardSchema = new Schema({
    name: {type: String},
    type: {type: String, default: 'board'},
    project: {type: Schema.Types.ObjectId, ref: 'Project'},
    owner: {type: Schema.Types.ObjectId, ref: 'User'},
    invitees: [{
        _id: {type: Schema.Types.ObjectId, ref: 'User'},
        email: {type: String}
    }],
    messages: [{
        user: {type: Schema.Types.ObjectId, ref: 'User'},
        mentions: [{type: Schema.Types.ObjectId, ref: 'User'}],
        text: {type: String},
        sendAt: {type: Date}
    }]
});

BoardSchema
.pre('save', function(next) {
    this.wasNew = this.isNew;
    this.editUser = this._editUser;
    this.inviteEmail = this._inviteEmail;
    this.inviteUser = this._inviteUser;
    this._modifiedPaths = this.modifiedPaths();
    if (!this.isNew){
        this.updatedAt = new Date();
    }

    next();
});

BoardSchema.post('save', function (doc) {
    var evtName = this.wasNew ? 'Board.Inserted' : 'Board.Updated';
    if (this._modifiedPaths) {
        doc._modifiedPaths = this._modifiedPaths
    }
    doc.editUser = this._editUser;
    doc.inviteEmail = this._inviteEmail;
    doc.inviteUser = this._inviteUser;
    EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('Board', BoardSchema);