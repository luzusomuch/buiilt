var _ = require('lodash');

/**
 * populate response error
 *
 * return {
 *  type: 'Validator',
 *  errors: {
 *    fieldName: {
 *      type: 'required',
 *      msg: 'Message data'
 *    }
 *  }
 * }
 */
exports.validationErrors = function(res, err, type, errorCode){
  //TODO - update me
  return res.json(422, err);
};