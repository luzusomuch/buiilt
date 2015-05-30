var _ = require('lodash');

/**
 *
 * @param {type} req
 * @param {type} cb
 * @returns {unresolved}validate for creation
 */
exports.validateCreate = function(req, cb) {
  req.checkBody('name', 'Project name is required').notEmpty();

  return cb(req.validationErrors(), _.assign(_.omit(req.body, 'createdAt', 'updatedAt', 'quote', 'homeBuilers'), {
    user: req.user._id
  }));
};

function validateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

function validatePhone(phone) {
  var re = /^\d{10}$/;
  return re.test(phone);
}