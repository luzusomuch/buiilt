'use strict';

var config = require('../../config/environment');
var VerifyToken = require('./../../models/verifyToken.model');
var User = require('./../../models/user.model');
var client = require("twilio")(config.twilio.sid, config.twilio.token);
var _ = require('lodash');
var async = require('async');

function makeid(){
    var text = "";
    var possible = "0123456789";

    for( var i=0; i < 6; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

exports.get = function(req, res) {
    VerifyToken.findOne({'token': req.query.token}, function(err, verifyToken) {
        if (err) {return res.send(500, err);}
        if (!verifyToken) {return res.send(404,err);}
        else {
            verifyToken.remove(function(err) {
                if (err) {return res.send(500,err);}
                else {
                    return res.send(200);
                }
            });
        }
    });
};

exports.create = function(req, res) {
    User.find({phoneNumber: req.body.phoneNumber}, function(err, users) {
        if (err) {return res.send(500,err);}
        if (users.length > 0) {
            return res.send(500, {msg: "This Phone Number Is Already Existed"});
        } else {
            VerifyToken.findOne({phoneNumber: req.body.phoneNumber}, function(err, verifyToken) {
                if (err) {return res.send(500,err);}
                if (!verifyToken) {
                    var newVefiryToken = new VerifyToken({
                        phoneNumber: req.body.phoneNumber,
                        token: makeid()
                    });
                    newVefiryToken.save(function(err) {
                        if (err) {
                            return res.send(500,err);
                        } else {
                            client.sendMessage({
                                to: newVefiryToken.phoneNumber,
                                from: config.twilio.phoneNumber,
                                body: "Your Verification PIN is " + newVefiryToken.token + ". From buiilt.com.au"
                            }, function(err, success) {
                                if (err) {console.log(err);}
                                return res.send(200);
                            });
                        }
                    });
                } else {
                    client.sendMessage({
                        to: verifyToken.phoneNumber,
                        from: config.twilio.phoneNumber,
                        body: "Your Verification PIN is " + verifyToken.token + ". From buiilt.com.au"
                    }, function(err, success) {
                        if (err) {console.log(err);}
                        return res.send(200);
                    });
                }
            });
        }
    });
};