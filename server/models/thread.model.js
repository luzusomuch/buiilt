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

var MessageSchema = new Schema({
    email: String,
    user : {
        type : Schema.Types.ObjectId,
        ref : 'User'
    },
    mentions: [{type: Schema.Types.ObjectId, ref: 'User'}],
    text : String,
    sendAt : {type : Date}
});

var ThreadSchema = new Schema({
    name: {
        type: String,
        // required: true
    },
    description: {
        type: String
    },
    owner : {
        type : Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },
    lastAccess: [{
        time: Date,
        user: Schema.Types.ObjectId
    }],
    project : {
        type : Schema.Types.ObjectId,
        ref : 'Project',
        required : true
    },
    element : {},
    members : [{
        type : Schema.Types.ObjectId, ref : 'User'
    }],
    notMembers: [{type: String, lowercase: true}],
    activities: [{
        email: String,
        user: {type: Schema.Types.ObjectId, ref: "User"},
        type: {type: String}, 
        createdAt: Date, 
        element: {}
    }],
    relatedItem: [{
        type: {type: String},
        item: {},
        members: [{type: Schema.Types.ObjectId, required: true, ref: "User"}],
        _id: false
    }],
    belongTo: {
        item: {},
        type: {type: String}
    },
    messages : [MessageSchema],
    isArchive: {type: Boolean, default: false},
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    // This is our latest version, thread must belong to an event
    event: {type: Schema.Types.ObjectId, ref: "Activity"}
}, {
    strict: true,
    minimize: false
});


/**
 * Load group by id
 * @param {type} id
 * @param {type} cb
 * @returns {undefined}
 */
ThreadSchema.statics.load = function (id, cb) {
    this.findOne({
        _id: id
    }).exec(cb);
};

ThreadSchema.post( 'init', function() {
    this._original = this.toJSON();
});

ThreadSchema.pre('save', function(next) {
    this._modifiedPaths = this.modifiedPaths();
    this.wasNew = this.isNew;
    this.editUser = this._editUser;
    this.evtName = this._evtName;
    this.message = this._message;
    this.messasgeType = this._messageType;
    this.isNewNotification = this._isNewNotification;
    next();
  });

ThreadSchema.post('save', function (doc) {
    if (this._modifiedPaths) {
        doc._modifiedPaths = this._modifiedPaths
    }
    if (this._original) {
        doc.oldUsers = this._original.members.slice();
    }
    doc.editUser = this.editUser;
    doc.message = this.message;
    doc.messasgeType = this._messageType;
    doc.isNewNotification = doc.isNewNotification;
    if (this.evtName ) {
        var evtName = this.evtName;
    } else {
        var evtName = this.wasNew ? 'Thread.Inserted' : 'Thread.Updated';
    }

    EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('Thread', ThreadSchema);