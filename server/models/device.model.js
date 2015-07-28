'use strict';
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
  
/**
 * contain all message of a conversion or group chat
 */
var DeviceSchema = new Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  deviceToken: String,
  platform: String,
  createdAt: {type: Date, default: Date.now}  
});

module.exports = mongoose.model('Device', DeviceSchema);