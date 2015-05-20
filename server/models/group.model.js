'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  async = require('async'),
  _ = require('lodash');

/**
 * put your comment there...
 *
 * @type Schema
 */
var GroupSchema = new Schema({
  name: String,
  alias: {
    type: String,
    trim: true,
    lowercase: true
  },
  type: {
    type: String,
    required: 'Group type is required'
  },
  description: {
    type: String,
    default: ''
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Group'
  },
  //related project
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  //creator
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
},{
  strict: true,
  minimize: false
});

/**
 * Validations
 */
// Validate empty name
GroupSchema
  .path('name')
  .validate(function (value) {
    return value.length;
  }, 'Name cannot be blank');

/**
 * Pre-save hook
 */
GroupSchema.pre('save', function (next) {
  next();
});

/**
 * @ngdoc static
 * @name Group#getChildren
 * @methodOf Group
 * @description
 * List all children groups from this group
 * @param {function(err, children)} callback callback function returning the list of children
 */
GroupSchema.statics.getChildren = function (group, callback) {
  var children = [],
    self = this;
  _getChildren([group]);
  // jshint latedef:nofunc
  function _getChildren(groups) {
    async.map(
      groups,
      function (group, _callback) {
        self.find({groupParent: group._id},
        _callback);
      },
      _nextChildren
      );
  }

  function _nextChildren(err, results) {
    var next = [];
    results.forEach(function (r) {
      next = next.concat(r);
    });
    children = children.concat(next);

    if (next.length) {
      getChildren(next, nextChildren);
    } else {
      if (!children.length) {
        return callback(null, []);
      }

      callback(null, children);
    }
  }
};

/**
 * Load group by id
 * @param {type} id
 * @param {type} cb
 * @returns {undefined}
 */
GroupSchema.statics.load = function (id, cb) {
  this.findOne({
    _id: id
  }).exec(cb);
};

module.exports = mongoose.model('Group', GroupSchema);