'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

var PeopleChatSchema = new Schema({
    project: {type: Schema.Types.ObjectId, ref: 'Project'},
    people: {type: Schema.Types.ObjectId, ref: 'People'},
    owner: {type: Schema.Types.ObjectId, ref: 'User'},
    ownerEmail: {type: String},
    from: {type: Schema.Types.ObjectId, ref: 'User'},
    fromEmail: {type: String},
    members: [{
        type: Schema.Types.ObjectId, ref: 'User'
    }],
    messages: [{
        user: {type: Schema.Types.ObjectId, ref: 'User'},
        mentions: [{type: Schema.Types.ObjectId, ref: 'User'}],
        text: {type: String},
        sendAt: {type: Date}
    }]
});

PeopleChatSchema
.pre('save', function(next) {
    this.wasNew = this.isNew;
    this.editUser = this._editUser;
    if (!this.isNew){
        this.updatedAt = new Date();
    }

    next();
});

PeopleChatSchema.post('save', function (doc) {
    var evtName = this.wasNew ? 'PeopleChat.Inserted' : 'PeopleChat.Updated';
    doc.editUser = this._editUser;
    EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('PeopleChat', PeopleChatSchema);