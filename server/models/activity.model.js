'use strict';
var EventBus = require('./../components/EventBus');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ActivitySchema = new Schema({
    name: String,
    owner: {type: Schema.Types.ObjectId, ref: "User", required: true},
    project: {type: Schema.Types.ObjectId, ref: "Project", required: true},
    date: {
        start: Date,
        end: Date
    },
    time: {
        start: Date,
        end: Date
    },
    relatedItem: [{
        type: {type: String},
        item: {},
        _id: false
    }],
    members: [{type: Schema.Types.ObjectId, ref: "User"}],
    notMembers: [String],
    createdAt: {type: Date, default: new Date()},
    updatedAt: Date
});

ActivitySchema.pre('save', function(next) {
    this.wasNew = this.isNew;
    this.editUser = this._editUser;
    if (!this.isNew){
        this.updatedAt = new Date();
    }
    next();
});

ActivitySchema.post('save', function(doc){
    var evtName = this.wasNew ? 'Activity.Inserted' : 'Activity.Updated';
    doc.editUser = this._editUser;
    EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('Activity', ActivitySchema);