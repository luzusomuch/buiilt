var _ = require('lodash');
//temp data, we have to improve it
var BuilderPackage = require('./../models/builderPackage.model');
/**
 *
 * @param {type} req
 * @param {type} cb
 * @returns {unresolved}validate for creation
 */
exports.validateCreate = function(req, cb) {
  req.checkBody('description', 'Description is required').notEmpty();
  req.checkBody('price', 'Description is required').notEmpty();
  // req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('package', 'Package is required').notEmpty();

  return cb(req.validationErrors(), _.assign(_.pick(req.body, 'description', 'price', 'package'), {
    user: req.user._id
  }));
};