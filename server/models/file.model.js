'use strict';

var mongoose = require('mongoose'),
        Schema = mongoose.Schema,
        elasticsearch = require('../helpers/elasticsearch')(),
        s3 = require('../helpers/s3')();

var FileSchema = new Schema({
  title: {
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
  previewData: {//preview meta data which is generated from image, pdf, psd, videos
    type: Schema.Types.Mixed
  },
  //who create it
  user: {// user object
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Virtuals
 */
FileSchema.virtual('fileUrl')
  .get(function() {
  if (this.serve === 's3') {
    return s3.getPublicUrlHttp(this.path);
  }
  return this.path;
});

/**
 * Pre-save hook
 */
FileSchema.pre('save', function(next) {
  this.wasNew = this.isNew;
  next();
});

/**
 * Methods
 */

FileSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    title: this.title,
    comments: this.comments,
    mimeType: this.mimeType,
    size: this.size,
    type: this.type,
    fileUrl: this.fileUrl,
    previewData: this.previewData,
    ownerId: this.ownerId,
    groupId: this.groupId,
    updatedAt: this.updatedAt,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('File', FileSchema);