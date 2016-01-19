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
    req.checkBody('detail.companyPhoneNumber', 'Company phone number is required').notEmpty();
    req.checkBody('detail.companyAddress.address', 'Company address is required').notEmpty();
    req.checkBody('detail.companyAddress.suburb', 'Company suburb is required').notEmpty();
    req.checkBody('detail.companyAddress.postCode', 'Company postcode is required').notEmpty();

    return cb(req.validationErrors(), _.pick(req.body, 'name', 'type', 'emails', 'detail'));
};

exports.validateUpdate = function (req, cb) {
    req.checkBody('name', 'Team name is required').notEmpty();
    req.checkBody('type', 'Team type is required').notEmpty();

    return cb(req.validationErrors(), _.pick(req.body, 'name', 'type', 'emails','detail'));
};
