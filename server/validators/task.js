var _ = require('lodash');

/**
 *
 * @param {type} req
 * @param {type} cb
 * @returns {unresolved}validate for creation
 */
exports.validateCreate = function (req, cb) {
  req.checkBody('name', 'Task title is required').notEmpty();
  var assignees = [];
  _.forEach(req.body.assignees,function(item) {
    assignees.push(item._id)
  });
  return cb(req.validationErrors(), _.assign(_.pick(req.body, 'name','dateEnd'),{
    assignees : assignees
  }));
};

exports.validateUpdate = function (req, cb) {
  req.checkBody('name', 'Task title is required').notEmpty();
  var assignees = [];
  _.forEach(req.body.assignees,function(item) {
    assignees.push(item._id)
  });
  return cb(req.validationErrors(), _.assign(_.pick(req.body, 'name','completed','completedBy','completedAt','dateEnd'),{
    assignees : assignees
  }));
};
