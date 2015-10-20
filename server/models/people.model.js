'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

var PeopleSchema = new Schema({
    project: {type: Schema.Types.ObjectId, ref: 'Project'},
    builders: [{
        _id: {type: Schema.Types.ObjectId, rel: 'User'},
        email: {type: String}
    }],
    architects: [{
        _id: {type: Schema.Types.ObjectId, rel: 'User'},
        email: {type: String}
    }],
    clients: [{
        _id: {type: Schema.Types.ObjectId, rel: 'User'},
        email: {type: String}
    }],
    subcontractors: [{
        _id: {type: Schema.Types.ObjectId, rel: 'User'},
        email: {type: String}
    }],
    consultants: [{
        _id: {type: Schema.Types.ObjectId, rel: 'User'},
        email: {type: String}
    }]
});

PeopleSchema
.pre('save', function(next) {
    this.wasNew = this.isNew;

    if (!this.isNew){
        this.updatedAt = new Date();
    }

    next();
});

PeopleSchema.post('save', function (doc) {
    var evtName = this.wasNew ? 'People.Inserted' : 'People.Updated';

    EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('People', PeopleSchema);