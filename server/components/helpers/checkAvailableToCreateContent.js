var _ = require('lodash');
var async = require('async');
var People = require('./../../models/people.model');

/*
Check if current user has role to create new item or not.
We check his role in project member and he has archive or not
*/
exports.check = function(project, user, cb) {
    People.findOne({project: project}, function(err, people) {
    	if (err || !people) {
    		cb(false);
    	} else {
    		var roles = ["builders", "clients", "architects", "contractors", "consultants"];
    		_.each(roles, function(role) {
    			_.each(people[role], function(tender) {
    				if (!tender.archive && tender.tenderers[0]._id && tender.tenderers[0]._id.toString()===user._id.toString()) {
    					cb(true);
    					return false;
    				} else if (tender.tenderers[0].teamMember.indexOf(user._id.toString()) !== -1 && (!tender.tenderers[0].archivedTeamMembers || (tender.tenderers[0].archivedTeamMembers && tender.tenderers[0].archivedTeamMembers.indexOf(user._id.toString()) === -1))) {
    					cb(true);
    					return false;
    				}
    			});
    		});
    	}
    });
};