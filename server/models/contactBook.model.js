'use strict';
var EventBus = require('./../components/EventBus');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ContactBookSchema = new Schema({
    team: {type: Schema.Types.ObjectId, ref: "Team", required: true},//owner of contact book
    inviter: {type: Schema.Types.ObjectId, ref: "User", required: true},
    user: {type: Schema.Types.ObjectId, ref: "User"},
    name: String,
    email: String,
    phoneNumber: String,
    createdAt: {type: Date, default: new Date()},
    updatedAt: Date
});

ContactBookSchema.pre('save', function(next) {
    this.wasNew = this.isNew;
    this.editUser = this._editUser;
    if (!this.isNew){
        this.updatedAt = new Date();
    }
    next();
});

ContactBookSchema.post('save', function(doc){
    var evtName = this.wasNew ? 'ContactBook.Inserted' : 'ContactBook.Updated';
    doc.editUser = this._editUser;
    EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('ContactBook', ContactBookSchema);