'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

//TODO - the task should have task category

var TaskSchema = new Schema({
  //creator
  team : {
    type : Schema.Types.ObjectId,
    ref : 'Team'
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  package : {
    type : Schema.Types.ObjectId,
    required : true
  },
  type : {
    type : String,
    enum : ['staff','contractor','builder']
  },
  assignees: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  title: {
    type: String,
    default: '',
    required: 'Title is required'
  },
  description: {
    type: String,
    default: ''
  },
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
  starred: {type: Boolean, default: false},
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

module.exports = mongoose.model('Task', TaskSchema);
