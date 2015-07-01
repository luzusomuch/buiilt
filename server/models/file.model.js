'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

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
  usersRelatedTo: [{
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    email: {
      type: String
    }
  }],
  //Maybe project or package ...
  belongTo: {type: Schema.Types.ObjectId},
  //Maybe contractor package or material package ...
  belongToType: {type: String},
  usersInterestedIn: [{
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
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
    default: 0
  },
  description: String,
  previewData: {//preview meta data which is generated from image, pdf, psd, videos
    type: Schema.Types.Mixed
  },
  //who create it
  user: {// user object
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  archive: {
    type: Boolean,
    default: true
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
    description: this.description,
    comments: this.comments,
    mimeType: this.mimeType,
    size: this.size,
    type: this.type,
    fileUrl: this.fileUrl,
    previewData: this.previewData,
    usersRelatedTo: this.usersRelatedTo,
    usersInterestedIn: this.usersInterestedIn,
    belongTo: this.belongTo,
    version: this.version,
    archive: this.archive,
    ownerId: this.ownerId,
    groupId: this.groupId,
    updatedAt: this.updatedAt,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('File', FileSchema);