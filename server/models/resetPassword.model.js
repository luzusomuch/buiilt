'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var EventBus = require('./../components/EventBus');
var User = require('./user.model');

var ResetPasswordSchema = new Schema({
  email: {type: String, lowercase: true},
  resetPasswordToken: String,
  expired: {
    type: Date
  },
  createdAt: {type: Date, default: Date.now}
}, {
  strict: true,
  minimize: false
});






// Validate email is not taken
ResetPasswordSchema
  .path('email')
  .validate(function (value, respond) {
    User.findOne({email: value}, function (err, user) {
      if (err)
        throw err;
      if (user) {
        return respond(true);
      }
      respond(false);
    });
  }, 'This email address has not been registered');

/**
 * Pre-save hook
 */
ResetPasswordSchema
  .pre('save', function (next) {
    this.wasNew = this.isNew;

    if (!this.isNew) {
      return next();
    } else if (this.isNew && !this.emailVerified) {
      //create email verify token
      this.resetPasswordToken = crypto.randomBytes(20).toString('hex');
      var currentDate = new Date();
      this.expired = currentDate.setMinutes(currentDate.getMinutes() + 30);
      next();
    }
  });

ResetPasswordSchema.post('save', function (doc) {
  var evtName = this.wasNew ? 'ResetPassword.Inserted' : 'ResetPassword.Updated';
  EventBus.emit(evtName, doc);
});


module.exports = mongoose.model('ResetPassword', ResetPasswordSchema);
