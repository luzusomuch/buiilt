'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    async = require('async'),
    _ = require('lodash');
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

/**
 * put your comment there...
 *
 * @type Schema
 */

var InviteTokenSchema = new Schema({
    element: {},
    user: {type: Schema.Types.ObjectId, rel: 'User'},
    type : String,
    inviteToken : String,
    email : String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    strict: true,
    minimize: false
});


InviteTokenSchema.pre('save', function(next) {
    this.wasNew = this.isNew;
    this.editUser = this._editUser;
    if (!this.isNew){
        this.updatedAt = new Date();
    } else {
        this.inviteToken = crypto.randomBytes(20).toString('hex');
    }
    next();
});

InviteTokenSchema.post("save", function(doc) {
    var evtName = this.wasNew ? 'InviteToken.Inserted' : 'InviteToken.Updated';
    doc.editUser = this._editUser;
    EventBus.emit(evtName, doc);
});


module.exports = mongoose.model('InviteToken', InviteTokenSchema);