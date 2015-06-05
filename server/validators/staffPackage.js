var _ = require('lodash');

/**
 *
 * @param {type} req
 * @param {type} cb
 * @returns {unresolved}validate for creation
 */
exports.validateCreate = function(req, cb) {
  req.checkBody('name', 'Project name is required').notEmpty();
  req.checkBody('description', 'Project description is required').notEmpty();

  return cb(req.validationErrors(), _.assign(_.pick(req.body, 'name', 'description'), {
    user: req.user._id
  }));
};
