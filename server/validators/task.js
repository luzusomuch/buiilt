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
    req.checkBody('description', 'Task description is required').notEmpty();
    // req.checkBody('selectedEvent', 'Selected event is required').notEmpty();
    var members = [];
    var notMembers = [];
    async.each(req.body.members, function(member, cb) {
        User.findOne({email: member.email}, function(err, user) {
            if (err) {cb(err);}
            else if (!user) {notMembers.push(member.email);cb();}
            else {members.push(user._id);cb();}
        })
    }, function() {
        return cb(req.validationErrors(), _.assign(_.pick(req.body, 'dateEnd', 'selectedEvent'),{
            members : members,
            notMembers: notMembers,
            description: req.body.description,
        }));
    });
};

exports.validateUpdate = function (req, cb) {
    var members = req.task.members;
    var notMembers = req.task.notMembers;
    if (req.body.editType === "assign") {
        async.each(req.body.newMembers, function(member, cb) {
            User.findOne({email: member.email}, function(err, user) {
                if (err) {cb(err);}
                else if (!user) {notMembers.push(member.email);cb();}
                else {members.push(user._id);cb();}
            })
        }, function() {
            return cb(req.validationErrors(), _.assign(_.pick(req.body, 'description','completed','completedBy','completedAt','dateEnd'),{
                members : members,
                notMembers: notMembers
            }));
        });
    } else if (req.body.editType==="change-date-time") {
        req.checkBody('dateStart', 'Task date start is required').notEmpty();
        req.checkBody('dateEnd', 'Task date end is required').notEmpty();
        req.checkBody('time.start', 'Task start time is required').notEmpty();
        req.checkBody('time.end', 'Task end time is required').notEmpty();
        return cb(req.validationErrors(), _.assign(_.pick(req.body, 'dateStart', 'dateEnd', 'time')));
    } else if (req.body.editType==="enter-comment") {
        req.checkBody("comment", "Comment is required").notEmpty();
        return cb(req.validationErrors(), _.assign(_.pick(req.body)));
    } else {
        req.checkBody('description', 'Task description is required').notEmpty();
        req.checkBody('dateEnd', 'Task end date is required').notEmpty();
        return cb(req.validationErrors(), _.assign(_.pick(req.body, 'description','completed','completedBy','completedAt','dateEnd'),{
            members : members
        }));
    }
};
