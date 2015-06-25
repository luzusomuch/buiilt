var _ = require('lodash');


exports.validateCreate = function(req, cb) {
  req.checkBody('name', 'Package name is required').notEmpty();
  req.checkBody('descriptions', 'Package description is required').notEmpty();
  var staffs = []
  _.forEach(req.body.staffs,function(staff) {
    console.log(staff);
    staffs.push(staff._id);
  })
  return cb(req.validationErrors(), _.assign(_.pick(req.body, 'name', 'descriptions'), {
    staffs : staffs
  }));
};
