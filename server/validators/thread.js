var _ = require('lodash');
var async = require("async");
var User = require("./../models/user.model");

exports.validateCreate = function (req, cb) {
  req.checkBody('name', 'Thread name is required').notEmpty();
  var members = [];
  var notMembers = [];
  async.each(req.body.members, function(member, cb) {
    User.findOne({email: member.email}, function(err, user) {
      if (err) {cb(err);}
      else if (!user) {notMembers.push(member.email);cb();}
      else {members.push(user._id);cb();}
    })
  }, function() {
    return cb(req.validationErrors(), _.assign(_.pick(req.body, 'name'),{
      members : members,
      notMembers: notMembers
    }));
  });
};

exports.validateUpdate = function (req, cb) {
  req.checkBody('name', 'Thread name is required').notEmpty();
  var members = req.thread.members;
  var notMembers = req.thread.notMembers;
  if (req.body.newMembers && req.body.newMembers.length > 0) {
    async.each(req.body.newMembers, function(member, cb) {
      User.findOne({email: member.email}, function(err, user) {
        if (err) {cb(err);}
        else if (!user) {notMembers.push(member.email);cb();}
        else {members.push(user._id);cb();}
      })
    }, function() {
      return cb(req.validationErrors(), _.assign(_.pick(req.body, 'name'),{
        members : members,
        notMembers: notMembers
      }));
    });
  }
};

exports.validateMessage = function (req, cb) {
  req.checkBody('text', 'Message text is required').notEmpty();
  return cb(req.validationErrors(), _.pick(req.body, 'text'));
};
