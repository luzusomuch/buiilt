var _ = require('lodash');

/**
 *
 * @param {type} req
 * @param {type} cb
 * @returns {unresolved}validate for creation
 */
exports.validateCreate = function(req, cb){
  req.checkBody('name', 'Project name is required').notEmpty();
  req.assert('requestedHomeBuilders', 'requestedHomeBuilders must be array').isArray();
  req.assert('requestedHomeBuilders', 'requestedHomeBuilders is required').notEmpty();
  req.assert('location.address', 'Address is required').notEmpty();
  req.assert('dateStart', 'dateStart is required').notEmpty();

  //TODO get geo code base on google

  return cb(req.validationErrors(), _.assign(_.omit(req.body, 'createdAt', 'updatedAt', 'quote', 'homeBuilder'), {
    user: req.user._id
  }));
};