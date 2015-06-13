var _ = require('lodash');

/**
 *
 * @param {type} req
 * @param {type} cb
 * @returns {unresolved}validate for creation
 */
exports.validateCreate = function (req, cb) {
  req.checkBody('name', 'Team name is required').notEmpty();
  req.checkBody('type', 'Team type is required').notEmpty();

  return cb(req.validationErrors(), _.pick(req.body, 'name', 'type', 'emails'));
};

exports.validateUpdate = function (req, cb) {
  req.checkBody('name', 'Team name is required').notEmpty();
  req.checkBody('type', 'Team type is required').notEmpty();

  return cb(req.validationErrors(), _.pick(req.body, 'name', 'type', 'emails','detail'));
};
