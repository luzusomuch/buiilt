var _ = require('lodash');

exports.validateCreate = function (req, cb) {
  req.checkBody('name', 'Thread name is required').notEmpty();
  var members = [];
  _.forEach(req.body.members,function(item) {
    members.push(item._id)
  });
  return cb(req.validationErrors(), _.assign(_.pick(req.body, 'name'),{
    members : members
  }));
};

exports.validateUpdate = function (req, cb) {
  req.checkBody('name', 'Thread name is required').notEmpty();
  var users = [];
  _.forEach(req.body.users,function(item) {
    users.push(item._id)
  });
  return cb(req.validationErrors(), _.assign(_.pick(req.body, 'name'),{
    users : users
  }));
};

exports.validateMessage = function (req, cb) {
  req.checkBody('text', 'Message text is required').notEmpty();
  return cb(req.validationErrors(), _.pick(req.body, 'text'));
};
