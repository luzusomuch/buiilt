var _ = require('lodash');

/**
 *
 * @param {type} req
 * @param {type} cb
 * @returns {unresolved}validate for creation
 */
exports.validateCreate = function(req, cb){
  req.checkBody('name', 'Project name is required').notEmpty();
  req.assert('requestedHomeBuilders', 'requestedHomeBuilders must be array').isArray();
  req.checkBody('requestedHomeBuilders', 'requestedHomeBuilders is required').notEmpty();
  req.assert('location.address', 'Address is required').notEmpty();
  // req.assert('dateStart', 'dateStart is required').notEmpty();

  //TODO get geo code base on google
  //populate requestedHomeBuilders
  var homeBuilers = [];
  _.each(req.body.requestedHomeBuilders, function(text){
    //kiem tra email hop le
    if(validateEmail(text)){
        homeBuilers.push({
            email: text
        });
    }else if(validatePhone(text)){
        homeBuilers.push({
            phoneNumber: text
        });
    }
  });

  return cb(req.validationErrors(), _.assign(_.omit(req.body, 'createdAt', 'updatedAt', 'quote', 'homeBuilers'), {
    user: req.user._id,
    requestedHomeBuilders: homeBuilers
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