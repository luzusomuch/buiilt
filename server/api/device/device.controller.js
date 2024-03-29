'use strict';

var Device = require('./../../models/device.model');
var User = require('./../../models/user.model');
var _ = require('lodash');
var async = require('async');

/*
    insert device token for user when he sign-in with ionic app for push notification
*/
exports.insertDevice = function(req, res) {
    Device.findOne({user: req.user._id, platform: req.body.deviceplatform, deviceToken: req.body.deviceToken}, function(err, device) {
        if (err) {return res.send(500,err);}
        else if (!device) {
            var newDevice = new Device({
                user: req.user._id,
                deviceToken: req.body.deviceToken,
                platform: req.body.deviceplatform
            });
            newDevice.save(function(err){
                if (err) {return res.send(500,err);}
                return res.send(200);
            });
        } else {
            return res.send(200);
        }
    })
};

/*
    remove device token for current user when he sign-out the ionic app
*/
exports.removeDevice = function(req, res) {
    Device.findOne({user: req.params.id, platform: req.query.deviceplatform}, function(err, device){
        if (err) {return res.send(500,err);}
        if (!device) {return res.send(404,{message: "Not Found"});}
        device.remove(function(err, data){
            if (err) {return res.send(500,err);}
            return res.send(200);
        });
    });
};