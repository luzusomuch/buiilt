var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var okay = require('okay');
var EventBus = require('./../components/EventBus');

var NotificationSchema = new Schema({
  text: String,
  owner : {
    type : Schema.Types.ObjectId,
    ref : 'User',
    required : true
  },
  fromUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }, //object of user send
  toUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }, //object of user receive
  element : {

  },
  project: {

  },
  referenceTo : String, // reference of element
  type:{
    type:String,
    required: true
  },//type of notification such as : change document, assign task, invite team, complete task
  unread: {
    type: Boolean,
    default: true
  },
  createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Notification', NotificationSchema);