/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var _ = require('lodash');

exports.validateNewUser = function(req, callback){
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('phoneNumber', 'Phone Number is required').notEmpty();
  if(validateEmail(req.body.email)){
    return callback(req.validationErrors(), _.omit(req.body, 'role','teamInviteToken','repasswords','acceptTeam','invite'));
  }
  else{
    return callback({msg : 'The email input not look like a valid email.'});
  }
};

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}