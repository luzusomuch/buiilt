'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

var BoardSchema = new Schema({
    name: {type: String},
    project: {type: Schema.Types.ObjectId, ref: 'Project'},
    owner: {type: Schema.Types.ObjectId, ref: 'User'},
    invitees: [{
        _id: {type: Schema.Types.ObjectId, ref: 'User'},
        email: {type: String}
    }],
    messages: [{
        user: {type: Schema.Types.ObjectId, ref: 'User'},
        text: {type: String},
        sendAt: {type: Date}
    }]
});

BoardSchema
.pre('save', function(next) {
    this.wasNew = this.isNew;

    if (!this.isNew){
        this.updatedAt = new Date();
    }

    next();
});

BoardSchema.post('save', function (doc) {
    var evtName = this.wasNew ? 'Board.Inserted' : 'Board.Updated';

    EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('Board', BoardSchema);