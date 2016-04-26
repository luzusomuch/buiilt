var _ = require('lodash');

exports.validateCreate = function(req, cb) {
    req.checkBody('name', 'Entity name is required').notEmpty();

    if (!req.body.isMilestone) {
        req.checkBody('date', 'Date is required').notEmpty();
        req.checkBody('date.start', 'Start date is required').notEmpty();
        req.checkBody('date.end', 'End date is required').notEmpty();
    }

    return cb(req.validationErrors(), _.assign(_.pick(req.body, "name", "date"), {
        name: req.body.name
    }));
};