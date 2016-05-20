'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    async = require('async'),
    _ = require('lodash');
var crypto = require('crypto');
var okay = require('okay');

/**
 * put your comment there...
 *
 * @type Schema
 */

var VerifyTokenSchema = new Schema({
    phoneNumber: String,
    token: String,
}, {
  strict: true,
  minimize: false
});

/**
 * Pre-save hook
 */
VerifyTokenSchema.pre('save', function (next) {
  next();
});

module.exports = mongoose.model('VerifyToken', VerifyTokenSchema);