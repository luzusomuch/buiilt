/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var _ = require('lodash');

exports.create = function(req, callback){
  req.checkBody('email', 'Email is required').notEmpty();
  if(validateEmail(req.body.email)){
    return callback(req.validationErrors(), req.body);
  }
  else{
    return callback('The email iuput not look like a valid email.');
  }
};

function validateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}