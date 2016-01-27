var _ = require('lodash');
var async = require("async");
var User = require("./../models/user.model");

/**
 *
 * @param {type} req
 * @param {type} cb
 * @returns {unresolved}validate for creation
 */
exports.validateCreate = function (req, cb) {
    // req.checkBody('name', 'Task title is required').notEmpty();
    req.checkBody('description', 'Task description is required').notEmpty();
    var members = [];
    var notMembers = [];
    async.each(req.body.members, function(member, cb) {
        User.findOne({email: member.email}, function(err, user) {
            if (err) {cb(err);}
            else if (!user) {notMembers.push(member.email);cb();}
            else {members.push(user._id);cb();}
        })
    }, function() {
        return cb(req.validationErrors(), _.assign(_.pick(req.body, 'dateEnd'),{
            members : members,
            notMembers: notMembers,
            description: req.body.description,
        }));
    });
};

exports.validateUpdate = function (req, cb) {
    var members = req.task.members;
    if (req.body.editType === "edit-task") {
        // req.checkBody('name', 'Task title is required').notEmpty();
        req.checkBody('description', 'Task description is required').notEmpty();
        req.checkBody('dateEnd', 'Task end date is required').notEmpty();
    } else if (req.body.editType === "assign") {
        _.forEach(req.body.newMembers,function(item) {
            members.push(item._id)
        });
    }
    return cb(req.validationErrors(), _.assign(_.pick(req.body, 'description','completed','completedBy','completedAt','dateEnd'),{
        members : members
    }));
};
