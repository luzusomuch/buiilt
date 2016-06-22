'use strict';

var ContactBook = require('./../../models/contactBook.model');
var PackageInvite = require('./../../models/packageInvite.model');
var User = require('./../../models/user.model');
var _ = require('lodash');
var async = require('async');
var moment = require("moment");

exports.create = function(req, res) {
    var data = req.body;
    if (data.contacts.length === 0) {
        return res.send(422, {msg: "Please check your contacts list"});
    } else {
        var result = [];
        async.each(data.contacts, function(contact, cb) {
            User.findOne({email: contact.email.toLowerCase()})
            .populate("team._id").exec(function(err, user) {
                if (err) {cb(err);}
                if (!user) {
                    var newContact = new ContactBook({
                        team: req.user.team._id,
                        inviter: req.user._id,
                        name: contact.firstName + " " + contact.lastName,
                        email: contact.email.toLowerCase(),
                        phoneNumber: contact.phoneNumber,
                        // teamName: contact.teamName
                    });
                    newContact._editUser = req.user;
                    newContact.save(function(err) {
                        if (err) {console.log(err);cb(err);}
                        result.push(newContact);
                        cb();
                    });
                } else {
                    var newContact = new ContactBook({
                        team: req.user.team._id,
                        inviter: req.user._id,
                        user: user._id,
                        name: user.firstName +" "+ user.lastName,
                        email: user.email,
                        phoneNumber: (user.phoneNumber) ? user.phoneNumber : contact.phoneNumber,
                        // teamName: (user.team._id) ? user.team._id.name : contact.teamName
                    });
                    newContact.save(function(err) {
                        if (err) {cb(err);}
                        result.push(newContact);
                        cb();
                    });
                }
            });
        }, function(err) {
            return res.send(200, result);
        });      
    }
};

exports.me = function(req, res) {
    if (req.user.team._id) {
        ContactBook.find({team: req.user.team._id})
        .populate("user", "_id name email phoneNumber")
        .exec(function(err, contactBooks) {
            if (err) {return res.send(500,err);}
            var result = [];
            _.each(contactBooks, function(contact) {
                if (contact.user) {
                    contact.email = contact.user.email;
                    contact.phoneNumber = contact.user.phoneNumber;
                    contact.name = contact.user.name;
                    result.push(contact);
                } else {
                    result.push(contact);
                }
            });
            return res.send(200, result);
        });
    } else {
        return res.send(200, []);
    }
};