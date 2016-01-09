'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');
var _ = require('lodash');

//TODO - the task should have task category

var TaskSchema = new Schema({
    //creator
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    project : {
        type : Schema.Types.ObjectId,
        ref : 'Project',
        required : true
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: []
    }],
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    element : {},
    activities: [{
        user: {type: Schema.Types.ObjectId, ref: "User", required: true},
        type: {type: String}, 
        createdAt: Date, 
        element: {}
    }],
    completed: { type: Boolean, default: false },
    completedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    completedAt: { type: Date },
    remindAt: {type: Date},
    files: [{
        type: Schema.Types.ObjectId,
        ref: 'File'
    }],
    //date start and date end can be null
    dateStart: { type: Date },
    //due date
    dateEnd: { type: Date },
    hasDateEnd : Boolean,
    //the sub task just has title, we don't need to separate a new model
    subTasks: [{
        title: {type: String, default: ''},
        completed: {type: Boolean, default: false},
        deleted: {type: Boolean, default: false},
        completedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User'
        },
        completedAt: { type: Date }
    }],
    archived: {type: Boolean, default: false},
    hidden: {type: Boolean, default: false},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
},{
    strict: true,
    minimize: false
});

TaskSchema.post( 'init', function() {
    this._original = this.toJSON();
});

TaskSchema.pre('save', function(next) {
    this._modifiedPaths = this.modifiedPaths();
    this.wasNew = this.isNew;
    this.editUser = this._editUser;
    this.hasDateEnd =  (this.dateEnd) ? true : false;
    next();
});

TaskSchema.post('save', function (doc) {
    var evtName = this.wasNew ? 'Task.Inserted' : 'Task.Updated';
    if (this._modifiedPaths) {
        doc._modifiedPaths = this._modifiedPaths
    }
    if (this._original) {
        doc._oldAssignees = this._original.assignees.slice(0);
    }
    doc.editUser = this._editUser;
    EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('Task', TaskSchema);


