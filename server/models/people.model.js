'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

var activities = {
    type: String,
    createdAt: {type: Date},
    reference: {}
};

var tender = {
    tenderName: String,
    tenderDescription: String,
    tenderers: [{
        _id: {type: Schema.Types.ObjectId, ref: 'User'},
        teamMember: [
            {type: Schema.Types.ObjectId, ref: 'User'}
        ],
        name: String,
        email: {type: String},
        tenderFile: [{
            name: String,
            link: String
        }],
        relatedItem: [{
            type: {type: String},
            item: {},
            _id: false
        }],
        activities: [activities]
    }],
    isDistribute: {type: Boolean, default: false},
    inviter: {type: Schema.Types.ObjectId, ref: 'User'},
    inviterActivities: [activities],
    inviterType: String,
    hasSelect: {type: Boolean, default: false},
    createdAt: {type: Date}
};

var PeopleSchema = new Schema({
    type: {type: String, default: 'people'},
    project: {type: Schema.Types.ObjectId, ref: 'Project'},
    builders: [tender],
    architects: [tender],
    clients: [tender],
    subcontractors: [tender],
    consultants: [tender]
});

PeopleSchema
.pre('save', function(next) {
    this.wasNew = this.isNew;
    this.editUser = this._editUser;
    this.newInviteeNotSignUp = this._newInviteeNotSignUp;
    this.newInviteeSignUpAlready = this._newInviteeSignUpAlready;
    this.winnerTender = this._winnerTender;
    this.loserTender = this._loserTender;
    this.newInviteType = this._newInviteType;
    this._modifiedPaths = this.modifiedPaths();
    if (!this.isNew){
        this.updatedAt = new Date();
    }

    next();
});

PeopleSchema.post('save', function (doc) {
    var evtName = this.wasNew ? 'People.Inserted' : 'People.Updated';
    if (this._modifiedPaths) {
        doc._modifiedPaths = this._modifiedPaths
    }
    doc.editUser = this._editUser;
    doc.newInviteeNotSignUp = this._newInviteeNotSignUp;
    doc.newInviteeSignUpAlready = this._newInviteeSignUpAlready;
    doc.winnerTender = this._winnerTender;
    doc.loserTender = this._loserTender;
    doc.newInviteType = this._newInviteType;
    EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('People', PeopleSchema);