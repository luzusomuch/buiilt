'use strict';
var s3 = require('../components/S3');
var EventBus = require('./../components/EventBus');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var FileSchema = new Schema({
    name: {
        type: String, // filename
        required: true
    },
    comments: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        comment: String,
        createAt: { type: Date, default: Date.now }
    }],
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    path: {
        type: String,
        required: true // path to server
    },
    server: {
        type: String, //server which is store file
        required: true
    },
    _serverData: Schema.Types.Mixed,
    mimeType: {
        type: String
    },
    size: {
        type: Number
    },
    version: {
        type: Number,
        default: 1
    },
    description: String,
    previewData: {//preview meta data which is generated from image, pdf, psd, videos
        type: Schema.Types.Mixed
    },
    //who create it
    owner: {// user object
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    project: {type: Schema.Types.ObjectId, ref: 'Project', required: true},
    archive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    tags: [String],
    key: String,
    element : {},
    activities: [{
        user: {type: Schema.Types.ObjectId, ref: "User", required: true},
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
    fileHistory: [{name: String, link: String, version: String, description: String}]
});

/**
 * Virtuals
 */
FileSchema.virtual('fileUrl')
  .get(function() {
  if (this.server === 's3') {
    return s3.getPublicUrl(this.key);
  }
  return this.path;
});

/**
 * Pre-save hook
 */
FileSchema.pre('save', function(next) {
  this.wasNew = this.isNew;
  if (!this.isNew){
    this.createdAt = new Date();
  }
  next();
});

FileSchema.post('save', function(doc){
  var evtName = this.wasNew ? 'File.Inserted' : 'File.Updated';
  EventBus.emit(evtName, doc);
});

module.exports = mongoose.model('File', FileSchema);