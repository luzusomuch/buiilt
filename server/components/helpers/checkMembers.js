var _ = require('lodash');
var async = require('async');
var User = require('./../../models/user.model');

/*Check if each user in members list
    @members is a list members
    @item is update existed item with current members and not members list
*/
exports.check = function(members, item, cb) {
    var result = {
        members: (item) ? item.members : [], 
        notMembers: (item) ? item.notMembers : []
    };
    async.each(members, function(member, callback) {
        User.findOne({email: member.email.toLowerCase()}, function(err, user) {
            if (err) {callback(err);}
            if (!user) {
                result.notMembers.push(member.email.toLowerCase());
                callback(null);
            } else {
                result.members.push(user._id);
                callback(null);
            }
        });
    }, function() {
        return cb(result);
    });
};