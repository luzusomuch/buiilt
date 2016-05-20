var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./../../models/user.model');

exports.setup = function () {
  passport.use(new LocalStrategy({
      usernameField: 'phoneNumber',
      passwordField: 'password' // this is the virtual field on the model
    },
    function(phoneNumber, password, done) {
      User.findOne({
        phoneNumber: phoneNumber
      }, function(err, user) {
        if (err) return done(err);

        if (!user) {
          return done(null, false, { message: 'This phone number is not registered.' });
        }
        if (!user.authenticate(password)) {
          return done(null, false, { message: 'This password is not correct.' });
        }
        user.hasChangedEmail = false;
        user.save(function() {
          return done(null, user);
        });

        //verify email
        //if (!user.emailVerified) {
        //  return done(null, false, { message: 'This email is not verified.' });
        //}

      });
    }
  ));
};