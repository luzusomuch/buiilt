'use strict';
var EventBus = require('./../components/EventBus');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var DocumentSchema = new Schema({
    owner: {type: Schema.Types.ObjectId, ref: "User", required: true},
    name: String,
    documents: [{type: Schema.Types.ObjectId, ref: "File"}],
    members: [{type: Schema.Types.ObjectId, ref: "User"}],
    project: {type: Schema.Types.ObjectId, ref: "Project", required: true},
    tender: {type: Schema.Types.ObjectId, ref: "Tender"},
    notMembers: [{type: String, lowercase: true}],
    createdAt: {type: Date, default: new Date()},
    archive: {type: Boolean, default: false},
    updatedAt: Date
});

DocumentSchema.pre('save', function(next) {
    this.wasNew = this.isNew;
    this.editUser = this._editUser;
    if (!this.isNew){
        this.updatedAt = new Date();
    }
    next();
});

DocumentSchema.post('save', function(doc){
    var evtName = this.wasNew ? 'Document.Inserted' : 'Document.Updated';
    doc.editUser = this._editUser;
    EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('Document', DocumentSchema);