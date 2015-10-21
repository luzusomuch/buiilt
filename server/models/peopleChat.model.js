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
    messages: [{
        user: {type: Schema.Types.ObjectId, ref: 'User'},
        text: {type: String},
        sendAt: {type: Date}
    }]
});

PeopleChatSchema
.pre('save', function(next) {
    this.wasNew = this.isNew;

    if (!this.isNew){
        this.updatedAt = new Date();
    }

    next();
});

PeopleChatSchema.post('save', function (doc) {
    var evtName = this.wasNew ? 'PeopleChat.Inserted' : 'PeopleChat.Updated';

    EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('PeopleChat', PeopleChatSchema);