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

var TeamSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    teamInviteToken : String,
    type: {
        type: String,
        required: 'Team type is required'
    },
    detail : {
        companyName : String,
        companyAddress : String,
        contactNumber : String,
        licenseNumber : String,
        billingAddress : {
            suburb: String,
            postCode: String
        }
    },
    //creator
    leader: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    project: [{
        type: Schema.Types.ObjectId,
        ref: 'Project'
    }],
    member: [{
        _id: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        email: {
            type: String
        },
        status: {type:String, enum: ['Pending','Active','Reject']}
    }],
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

/**
 * Pre-save hook
 */

/**
 * Load group by id
 * @param {type} id
 * @param {type} cb
 * @returns {undefined}
 */
TeamSchema.statics.load = function (id, cb) {
    this.findOne({_id: id}).exec(cb);
};

TeamSchema.post( 'init', function() {
    this._original = this.toJSON();
});

TeamSchema
.pre('save', function(next) {
    this.wasNew = this.isNew;
    this.evtName = this._evtName;
    this.user = this._user;
    this.toUser = this._toUser;
    if (!this.isNew){
        this.updatedAt = new Date();
    } else {
        this.teamInviteToken = crypto.randomBytes(20).toString('hex');
    }

    next();
});

TeamSchema.post('save', function (doc) {
    if (this._original) {
        doc.oldMember = this._original.member.slice();  
    }
    if (this._modifiedPaths) {
        doc._modifiedPaths = this._modifiedPaths
    }
    doc.user = this.user;
    doc.toUser = this.toUser;
    if (this.evtName) {
        var evtName = this.evtName;
    } else {
        var evtName = this.wasNew ? 'Team.Inserted' : 'Team.Updated';
    }

    EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('Team', TeamSchema);