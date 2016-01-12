var _ = require('lodash');

/**
 *
 * @param {type} req
 * @param {type} cb
 * @returns {unresolved}validate for creation
 */
exports.validateCreate = function (req, cb) {
    req.checkBody('name', 'Task title is required').notEmpty();
    req.checkBody('description', 'Task description is required').notEmpty();
    var members = [];
    _.forEach(req.body.members,function(item) {
        members.push(item._id)
    });
    return cb(req.validationErrors(), _.assign(_.pick(req.body,'dateEnd'),{
        name: req.body.name,
        description: req.body.description,
        members : members
    }));
};

exports.validateUpdate = function (req, cb) {
    var members = req.task.members;
    if (req.body.editType === "edit-task") {
        req.checkBody('name', 'Task title is required').notEmpty();
        req.checkBody('description', 'Task description is required').notEmpty();
        req.checkBody('dateEnd', 'Task end date is required').notEmpty();
    } else if (req.body.editType === "assign") {
        _.forEach(req.body.newMembers,function(item) {
            members.push(item._id)
        });
    }
    return cb(req.validationErrors(), _.assign(_.pick(req.body, 'name', 'description','completed','completedBy','completedAt','dateEnd'),{
        members : members
    }));
};
