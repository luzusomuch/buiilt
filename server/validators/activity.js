var _ = require('lodash');

exports.validateCreate = function(req, cb) {
    req.checkBody('name', 'Entity name is required').notEmpty();

    if (!req.body.isMilestone) {
        req.checkBody('date', 'Date is required').notEmpty();
        req.checkBody('date.start', 'Start date is required').notEmpty();
        req.checkBody('date.end', 'End date is required').notEmpty();

        req.checkBody('time', 'Time is required').notEmpty();
        req.checkBody('time.start', 'Start time is required').notEmpty();
        req.checkBody('time.end', 'End time is required').notEmpty();
    }

    return cb(req.validationErrors(), _.assign(_.pick(req.body, "name", "date", "time"), {
        name: req.body.name
    }));
};