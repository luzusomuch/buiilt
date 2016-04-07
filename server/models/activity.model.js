'use strict';
var s3 = require('../components/S3');
var EventBus = require('./../components/EventBus');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ActivitySchema = new Schema({
    owner: {type: Schema.Types.ObjectId, ref: "User", required: true},
    project: {type: Schema.Types.ObjectId, ref: "Project", required: true},
    estimated: {
        date: {
            start: Date,
            end: Date
        },
        time: {
            start: Date,
            end: Date
        }
    },
    actual: {
        date: {
            start: Date,
            end: Date
        },
        time: {
            start: Date,
            end: Date
        }
    },
    percentageComplete: Number,
    relatedItem: [{
        type: String,
        _id: Schema.Types.ObjectId,
        element: {}
    }],
    members: [{type: Schema.Types.ObjectId, ref: "User"}],
    notMembers: [String],
    createdAt: {type: Date, default: new Date()},
    updatedAt: type: Date,
    dependencies: [{
        activity: {type: Schema.Types.ObjectId, ref: "Activity"},
        lag: Number, 
        lagType: String //maybe hours or days
    }],
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