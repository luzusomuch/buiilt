'use strict';

var Device = require('./../../models/device.model');
var User = require('./../../models/user.model');
var _ = require('lodash');
var async = require('async');

exports.insertDevice = function(req, res) {
    var device = new Device({
        user: req.user._id,
        deviceToken: req.body.deviceToken,
        platform: req.body.deviceplatform
    });
    device.save(function(err){
        if (err) {return res.send(500,err);}
    })
};

exports.removeDevice = function(req, res) {
    Device.findOne({user: req.params.id}, function(err, device){
        if (err) {return res.send(500,err);}
        if (!device) {return res.send(404,err);}
        device.remove(function(err, data){
            if (err) {return res.send(500,err);}
            return res.send(200,'success');
        });
    });
};

exports.getDevice = function(req, res) {
    Device.findOne({user: req.params.id}, function(err, device){
        if (err) {return res.send(500,err);}
        if (!device) {return res.send(404,err);}
        return res.send(200,device);
    });
};