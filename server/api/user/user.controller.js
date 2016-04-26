'use strict';

var User = require('./../../models/user.model');
var ContactBook = require('./../../models/contactBook.model');
var Task = require('./../../models/task.model');
var Thread = require('./../../models/thread.model');
var File = require('./../../models/file.model');
var Notification = require('./../../models/notification.model');
var NotificationHelper = require('./../../components/helpers/notification');

var ResetPassword = require('./../../models/resetPassword.model');
var Project = require('./../../models/project.model');
var PackageInvite = require('./../../models/packageInvite.model');
var People = require('./../../models/people.model');
var Tender = require('./../../models/tender.model');
var Team = require('./../../models/team.model');
var InviteToken = require('./../../models/inviteToken.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var ResetPasswordValidator = require('./../../validators/resetPassword');
var UserValidator = require('./../../validators/user');
var okay = require('okay');
var async = require('async');
var _ = require('lodash');
var Mailer = require('./../../components/Mailer');
var crypto = require('crypto');
var mongoose = require("mongoose");
var stripe = require("stripe")(config.stripe);
var moment = require("moment");
var client = require("twilio")(config.twilio.sid, config.twilio.token);

function makeid(){
    var text = "";
    var possible = "0123456789";

    for( var i=0; i < 6; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

var validationError = function (res, err) {
    return res.json(422, err);
};

/*
    Show user profile by id include his team
*/
exports.getUserProfile = function(req, res) {
    var condition = {};
    if (req.query.id) {
        condition = {_id: req.query._id};
    } else if (req.query.email && req.query.phoneNumber) {
        condition = {$or:[{email: req.query.email}, {phoneNumber: req.query.phoneNumber}]};
    } else {
        return res.send(404);
    }
    User.findOne(condition).populate("team._id").exec(function(err, user) {
        if (err) {return res.send(500,err);}
        else if (!user) {return res.send(404, "The specific user is not existed!");}
        else {
            return res.send(200, {email: user.email, name: user.name, phoneNumber: user.phoneNumber, teamName: (user.team._id)?user.team._id.name:"This user hasn\'t got team"});
        }
    });
};

/*
    Update user profile
    require admin role
*/
exports.adminUpdateUserProfile = function(req, res) {
    var data = req.body;
    User.findById(req.params.id, function(err, user) {
        if (err) {return res.send(500,err);}
        if (!user) {return res.send(404);}
        user.firstName = data.firstName;
        user.lastName = data.lastName;
        user.phoneNumber = data.phoneNumber;
        user.name = data.firstName + " " + data.lastName;
        user.save(function(err) {
            if (err) {return res.send(500,err);}
            return res.send(200,user);
        });
    });
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function (req, res) {
    var query = {};
    if (req.user.role==="admin" && !req.query.email && !req.query.phoneNumber) {
        query = {};
    } else if (req.query.email && req.query.phoneNumber) {
        query = {$or:[{email: req.query.email}, {phoneNumber: new RegExp(req.query.phoneNumber, 'i')}]};
    } else {
        return res.send(406, {msg: "Not Allow"});
    }
    User.find(query, '-salt -hashedPassword')
    .populate("team._id").exec(function (err, users) {
        if (err)
            return res.send(500, err);
        var result = [];
        if (req.user.role==="admin" && !req.query.email && !req.query.phoneNumber) {
            result = users;
        } else if (req.query.email && req.query.phoneNumber) {
            _.each(users, function(user) {
                result.push({email: user.email, name: user.name, phoneNumber: user.phoneNumber, teamName: (user.team._id)?user.team._id.name:"This user hasn\'t got team"})
            });
        }
        res.json(200, result);
    });
};

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
    var invite = req.body.invite;
    var packageInvite;
    async.parallel([
        function (cb) {
            PackageInvite.findById(req.body.packageInviteToken, function(err, _packageInvite) {
                if (err || !_packageInvite) {cb();}
                else {
                    packageInvite = _packageInvite;
                    cb();
                }
            });
        }
    ], function() {
        if (packageInvite && packageInvite._id && packageInvite.to !== req.body.email) {
            return res.send(500, {msg: "Not valid email"});
        } else {
            UserValidator.validateNewUser(req, function(err, data) {
                if (err) {return res.send(422, {errors: err});}
                var newUser = new User(data);
                newUser.provider = 'local';
                newUser.role = 'user';
                newUser.name = data.firstName + ' ' + data.lastName;
                newUser.phoneNumberVerifyToken = makeid();
                newUser.save(function(err) {
                    if (err) {return res.send(500,err);}
                    var token = jwt.sign({_id: newUser._id}, config.secrets.session, {expiresInMinutes: 60 * 5});
                    async.parallel([
                        function (cb) {
                            if (invite) {
                                if (invite.type == 'team-invite') {
                                    var update = {
                                        "member.$._id" : newUser._id,
                                        "member.$.status" : 'Active'
                                    };
                                    Team.update({_id : invite.element._id,'member.email' : req.body.email},{'$set' : update,'$unset' : {'member.$.email' : 1}},function(err) {
                                        if (err) {
                                            newUser.remove(cb);
                                        }
                                        newUser.emailVerified = true;
                                        newUser.team = {
                                            _id : invite.element._id,
                                            role : 'member'
                                        };
                                        newUser.save(function() {
                                            InviteToken.findById(invite._id, function(err, inviteToken) {
                                                if (err || !inviteToken) {cb(err);}
                                                var params = {
                                                    owners : [inviteToken.user],
                                                    fromUser : newUser._id,
                                                    element : invite.element,
                                                    referenceTo : 'team',
                                                    type : 'team-accept'
                                                };
                                                NotificationHelper.create(params,function() {
                                                    inviteToken.remove(cb);
                                                });
                                            });
                                        });
                                    });
                                } else {
                                    cb();
                                }
                            } else {
                                if (newUser.team._id) {
                                    cb();
                                } else {
                                    InviteToken.find({email: newUser.email}, function(err, inviteTokens) {
                                        if (err) {cb();}
                                        async.each(inviteTokens, function(inviteToken, callback) {
                                            if (inviteToken.type==="team-invite") {
                                                var update = {
                                                    "member.$._id" : newUser._id,
                                                    "member.$.status" : 'Active'
                                                };
                                                Team.update({_id : inviteToken.element._id,'member.email' : req.body.email},{'$set' : update,'$unset' : {'member.$.email' : 1}},function(err) {
                                                    if (err) {
                                                        newUser.remove(callback);
                                                    }
                                                    newUser.emailVerified = true;
                                                    newUser.team = {
                                                        _id : inviteToken.element._id,
                                                        role : 'member'
                                                    };
                                                    newUser.save(function() {
                                                        var params = {
                                                            owners : [inviteToken.user],
                                                            fromUser : newUser._id,
                                                            element : inviteToken.element,
                                                            referenceTo : 'team',
                                                            type : 'team-accept'
                                                        };
                                                        NotificationHelper.create(params,function() {
                                                            inviteToken.remove(callback);
                                                        });
                                                    });
                                                });
                                            } else {
                                                callback();
                                            }
                                        }, cb);
                                    });
                                }
                            }
                        },
                        function (cb) {
                            // get all package invite related to current sign up user
                            PackageInvite.find({to: newUser.email}, function(err, packageInvites) {
                                if (err) {cb(err);}
                                async.each(packageInvites, function(invite, callback) {
                                    async.parallel([
                                        function (cb) {
                                            if (invite.inviteType==="contactBook") {
                                                // Update contact book
                                                ContactBook.findById(invite.package, function(err, contactBook) {
                                                    if (err || !contactBook) {cb();}
                                                    else {
                                                        contactBook.user = newUser._id;
                                                        contactBook.name = newUser.name;
                                                        contactBook.phoneNumber = newUser.phoneNumber;
                                                        contactBook.save(cb);
                                                    }
                                                });
                                            } else {
                                                // Update project members for current sign up user if existed
                                                People.findById(invite.package, function(err, people) {
                                                    if (err || !people) {cb();}
                                                    else {
                                                        _.each(people[invite.inviteType], function(tender) {
                                                            if (tender.hasSelect && tender.tenderers[0].email === newUser.email) {
                                                                isSkipInTender = true;
                                                                tender.tenderers[0]._id = newUser._id;
                                                                tender.tenderers[0].email = null;
                                                                newUser.projects.push(invite.project);
                                                                newUser.markModified("projects");
                                                                newUser.save();
                                                            }
                                                        });
                                                        people._editUser = newUser;
                                                        peopleResult = people;
                                                        people.save(function(err) {
                                                            if (err) {cb(err);}
                                                            newUser.projects.push(invite.project);
                                                            newUser.markModified("projects");
                                                            newUser.save(cb);
                                                        });
                                                    }
                                                });
                                            }
                                        },
                                        function (cb) {
                                            // Update tender for current sign up user if existed
                                            Tender.findById(invite.package, function(err, tender) {
                                                if (err || !tender) {cb();}
                                                else {
                                                    _.each(tender.members, function(member) {
                                                        if (member.email === newUser.email) {
                                                            member.user = newUser._id;
                                                            member.email = null;
                                                            if (member.activities && member.activities.length > 0) {
                                                                _.each(member.activities, function(activity) {
                                                                    if (activity.type === "send-message" && activity.email && activity.email===newUser.email) {
                                                                        activity.email = null;
                                                                        activity.newUser = newUser._id
                                                                    }
                                                                });
                                                            }
                                                        }
                                                    });
                                                    tender._editUser = newUser;
                                                    tenderResult = tender;
                                                    tender.save(cb);
                                                }
                                            });
                                        }
                                    ], function() {
                                        invite.remove(callback);
                                    });
                                }, cb);
                            });
                        },
                        function (cb) {
                            Task.find({}, function(err, tasks) {
                                if (err) {cb();}
                                async.each(tasks, function(task, callback) {
                                    if (task.owner && task.description) {
                                        var currentUserIndex = _.indexOf(task.notMembers, newUser.email);
                                        if (currentUserIndex !== -1) {
                                            task.members.push(newUser._id);
                                            task.notMembers.splice(currentUserIndex, 1);
                                        }
                                        task._editUser = newUser;
                                        task.save(callback());
                                    } else {
                                        callback();
                                    }
                                },cb);
                            });
                        },
                        function (cb) {
                            File.find({}, function(err, files) {
                                if (err) {cb();}
                                async.each(files, function(file, callback) {
                                    if (file.owner && file.project) {
                                        _.each(file.activities, function(activity) {
                                            if (activity.members && activity.acknowledgeUsers) {
                                                var memberIndex = _.findIndex(activity.members, function(member) {
                                                    if (member.email) {
                                                        return member.email===newUser.email;
                                                    }
                                                });
                                                if (memberIndex !== -1) {
                                                    activity.members[memberIndex]._id = newUser._id;
                                                    activity.members[memberIndex].email = null;
                                                }

                                                var acknowUserIndex = _.findIndex(activity.acknowledgeUsers, function(u) {
                                                    if (u.email) {
                                                        return u.email===newUser.email;
                                                    }
                                                });
                                                if (acknowUserIndex !== -1) {
                                                    activity.acknowledgeUsers[acknowUserIndex]._id = newUser._id;
                                                    activity.acknowledgeUsers[acknowUserIndex].email = null;
                                                }
                                            }
                                        });
                                        if (file.element && file.element.type === "document") {
                                            if (file.fileHistory && file.fileHistory.length > 0) {
                                                _.each(file.fileHistory, function(history) {
                                                    if (history.members && history.members.length > 0) {
                                                        var index = _.findIndex(history.members, function(member) {
                                                            if (member.email) {
                                                                return member.email===newUser.email;
                                                            }
                                                        });
                                                        if (index !== -1) {
                                                            history.members[index]._id = newUser._id;
                                                            history.members[index].email = null;
                                                        }
                                                    }
                                                });
                                            }
                                        } else {
                                            var currentUserIndex = _.indexOf(file.notMembers, newUser.email);
                                            if (currentUserIndex !== -1) {
                                                file.members.push(newUser._id);
                                                file.notMembers.splice(currentUserIndex, 1);
                                            }
                                        }
                                        file.save(callback());
                                    } else 
                                        callback();
                                },cb);
                            });
                        },
                        function (cb) {
                            Thread.find({}, function(err, threads) {
                                if (err) {cb();}
                                async.each(threads, function(thread, callback) {
                                    var currentUserIndex = _.indexOf(thread.notMembers, newUser.email);
                                    if (currentUserIndex !== -1) {
                                        thread.members.push(newUser._id);
                                        thread.notMembers.splice(currentUserIndex, 1);
                                    }
                                    thread.save(callback());
                                },cb);
                            });
                        },
                    ], function(err) {
                        if (err) {
                            newUser.remove(function(error) {
                                return res.send(500,err);
                            });
                        } else {
                            client.sendMessage({
                                to: newUser.phoneNumber,
                                from: config.twilio.phoneNumber,
                                body: "Your active code is "+ newUser.phoneNumberVerifyToken
                            }, function(err, success) {
                                if (err) {console.log(err);}
                                return res.json({token: token,emailVerified : true});
                            });
                        }
                    });
                });
            });
        }
    });
};

/**
 * Get a single user
 */
exports.show = function (req, res, next) {
    var userId = req.params.id;
    User.findById(userId, '-salt -hashedPassword', function (err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.send(404);
        }
        return res.json(user);
    });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function (req, res) {
    User.findByIdAndRemove(req.params.id, function (err, user) {
        if (err) {
            return res.send(500, err);
        }
        if (user.team._id) {
            Team.findById(user.team._id, function(err, team){
                if (err) {return res.send(500,err);}
                var teamMembers = team.leader;
                _.each(team.member, function(member){
                    if (member._id) {
                        teamMembers.push(member._id);
                    }
                });
                _.remove(teamMembers, user._id);
                team.markModified('member');
                team.markModified('leader');
                team._user = req.user;
                team.save(function(err) {
                    if (err) {return res.send(500,err);}
                    return res.send(200);
                });
            });
        }
        return res.send(200);
    });
};

/**
 * Change a users password
 */
exports.changePassword = function (req, res, next) {
    var user = req.user;
    var oldPass = String(req.body.oldPassword);
    var newPass = String(req.body.newPassword);
    User.findById(user._id, function (err, user) {
        if (!user.authenticate(oldPass)) {
            return res.send(422,{msg : 'This password is not correct.'});
        }
        user.password = newPass;
        user.save(function(err) {
            if (err) {return validationError(res, err);}
            res.send(200);
        });
    });
};

/*
    Change user email
*/
exports.changeEmail = function(req,res) {
    var user = req.user;
    User.findById(user._id,function(err,user) {
        if (user.email == req.body.email) {
            return res.json(true);
        }
        user.changeEmailToken = crypto.randomBytes(20).toString('hex');
        var currentDate = new Date();
        user.expired = currentDate.setMinutes(currentDate.getMinutes() + 30);
        user.emailChange = req.body.email;
        user._evtName = "User.ChangeEmail";
        user.save(function(err) {
            if (err) {
                return res.send(500,err)
            }
            return res.json(true);
        });
    });
};

/*
    User change their current profile
*/
exports.changeProfile = function(req, res) {
    User.findById(req.user._id, function(err, user){
        if (err) {return res.send(500,err);}
        if (!user) {return res.send(404,{message: "The specific user is not existed"});}
        else {
            if (req.body.editType === "enterCreditCard") {
                user.creditCard = req.body.creditCard;
            } else if(req.body.editType === "favouriteProjects") {
                /*req.body is a project*/
                var index = user.favouriteProjects.indexOf(req.body._id);
                if (index !== -1) {
                    user.favouriteProjects.splice(index, 1);
                } else {
                    user.favouriteProjects.push(req.body._id);
                }
            } else {
                user.firstName = req.body.firstName;
                user.lastName = req.body.lastName;
                user.phoneNumber = req.body.phoneNumber;
                user.name = req.body.firstName +' '+req.body.lastName;
            }
            user.save(function(err,saved){
                if (err) {return res.send(500,err);}
                return res.json(200,saved);
            });
        }
    });
};

/**
 * Get my info
 */
exports.me = function (req, res, next) {
    var userId = req.user._id;
    User.findOne({_id: userId}, '-salt -hashedPassword')
    .populate('projects').exec(function (err, user) { // don't ever give out the password or salt
        if (err) {return next(err);}
        if (!user) {return res.json(404);}
        async.each(user.projects, function(project, cb) {
            Notification.find({owner: user._id, unread: true, "element.project": project._id, $or:[{referenceTo: "task"}, {referenceTo: "thread"}, {referenceTo: "file"}, {referenceTo: "document"}]}, function(err, notifications) {
                if (err) {cb();}
                else {
                    var tasks = [];
                    var threads = [];
                    var files = [];
                    var documents = [];
                    _.each(notifications, function(notification) {
                        if (notification.referenceTo === "task") {
                            tasks.push(notification);
                        } else if (notification.referenceTo === "thread") {
                            threads.push(notification);
                        } else if (notification.referenceTo === "file" && !req.query.isMobile) {
                            files.push(notification);
                        } else if (notification.referenceTo === "document" && !req.query.isMobile) {
                            documents.push(notification);
                        }
                    });
                    var uniqTasks = _.map(_.groupBy(tasks,function(doc){
                        return doc.element._id;
                    }),function(grouped){
                      return grouped[0];
                    });
                    var uniqThreads = _.map(_.groupBy(threads,function(doc){
                        return doc.element._id;
                    }),function(grouped){
                      return grouped[0];
                    });
                    var uniqFiles = _.map(_.groupBy(files,function(doc){
                        return doc.element._id;
                    }),function(grouped){
                      return grouped[0];
                    });
                    var uniqDocuments = _.map(_.groupBy(documents,function(doc){
                        return doc.element._id;
                    }),function(grouped){
                      return grouped[0];
                    });
                    project.__v = uniqTasks.length + uniqThreads.length + uniqFiles.length + uniqDocuments.length;
                    cb();
                }
            });
        }, function() {
            return res.json(user);
        });
    });
};

/*
    Send email verification again
*/
exports.sendVerification = function(req,res) {
    var user = req.user;
    if(!user.emailVerified){
        Mailer.sendMail('confirm-email.html', config.emailFrom, user.email, {
            user: user,
            confirmation: config.baseUrl + 'auth/confirm-email/' + user.emailVerifyToken,
            subject: 'Confirm email from buiilt.com'
        }, function(err){
            if (err) {
                return res.send(500,err);
            } else {
                return res.json(200, 'successful');
            }
        });
    } else {
        return res.send(422,{msg: 'blah blah blah'})
    }
};

/*
    send reset password token to request email
*/
exports.forgotPassword = function(req,res) {
    ResetPassword.remove({email : req.body.email},function(err) {
        if (err) {
            return res.send(500,err);
        }
        ResetPasswordValidator.create(req,function(err,data) {
            if (err) {
                return res.send(422,err);
            }
            var resetPassword = new ResetPassword(data);
            resetPassword.save(function(err) {
                if (err) {
                    return res.send(422,err);
                }
                return res.json(true);
            });
        });
    });
};

/*
    reset password when it's valid token
*/
exports.resetPassword = function(req,res) {
    ResetPassword.findOne({resetPasswordToken : req.body.token},function(err,resetPassword) {
        if (err || !resetPassword){
            return res.send(422,err);
        }
        User.findOne({email : resetPassword.email},function(err,user) {
            if (err || !user) {
                return res.send(422,err)
            }
            user.password = req.body.password;
            user.save(function(err) {
                if (err) {return res.send(422, err);}
                resetPassword.remove();
                return res.json(true);
            });
        });
    });
};

/*
    get the reset password token when user open reset password email
*/
exports.getResetPasswordToken = function(req,res) {
    ResetPassword.findOne({resetPasswordToken : req.params.id},function(err,resetPassword) {
        if (err || !resetPassword) {
            return res.send(500,err);
        }
        return res.json(resetPassword);
    });
};

/*
    charge user when they click buy plan in a stripe modal
*/
exports.buyPlan = function(req, res) {
    var data = req.body;
    User.findOne({email: req.user.email}, '-hashedPassword -salt', function(err, user) {
        if (err) {return res.send(500,err);}
        else if (!user) {return res.send(404, {msg: "The specific user is not existed"});}
        else {
            stripe.plans.list({limit: 3}, function(err, plan) {
                if (err) {return res.send(500,err);}
                else if (plan.data.length === 0) {return res.send(404, {msg: "There are no plan to purchase"});}
                else {
                    var currentPlan = _.find(plan.data, function(item) {return item.id === data.plan});
                    stripe.customers.list(function(err, customers) {
                        if (err) {return res.send(500,err);}
                        var currentCustomer = _.find(customers.data, function(item) {return item.email === user.email});
                        var isCustomer = false;
                        async.parallel([
                            function(cb) {
                                if (!currentCustomer) {
                                    stripe.customers.create({email: user.email, source: data.stripeToken}, function(err, customer) {
                                        if (err) {cb(err);}
                                        else {cb(null, customer);}
                                    });
                                } else {
                                    isCustomer = true;
                                    cb(null, currentCustomer);
                                }
                            }
                        ], function(err, result) {
                            if (err) {return res.send(err);}
                            var customer = result[0];
                            if (!isCustomer) {
                            stripe.customers.createSubscription(customer.id, {plan: currentPlan.id}, function(err, subscription) {
                                if (err) {return res.send(500,err);}
                                user.plan = data.plan;
                                user.save(function(err) {
                                    if (err) {return res.send(500,err);}
                                    return res.send(200, user);
                                });
                            });
                          } else {
                            stripe.customers.updateSubscription(customer.id, customer.subscriptions.data[0].id, {plan: currentPlan.id}, function(err, subscription) {
                                if (err) {return res.send(500,err);}
                                stripe.charges.create({
                                    amount: currentPlan.amount,
                                    currency: currentPlan.currency,
                                    source: data.stripeToken,
                                    description: user.name + " has purchased for " + data.plan
                                },function(err, charge) {
                                    if (err) {return res.send(500,err);}
                                    user.plan = data.plan;
                                    user.save(function(err) {
                                        if (err) {return res.send(500,err);}
                                        return res.send(200, user);
                                    });
                                });
                            });
                          }
                        });
                    });
                }
            });
        }
    });
};

/*
    charge user immedietly if they already is stripe customer
    if not app'll open a stripe modal
*/
exports.getCurrentStripeCustomer = function(req, res) {
    stripe.customers.list(function(err, customers) {
        if (err) {return res.send(500,err);}
        var currentCustomer = _.find(customers.data, function(item) {return item.email === req.user.email});
        if (currentCustomer) {
            stripe.plans.list({limit: 3}, function(err, plan) {
                if (err) {return res.send(500,err);}
                var currentPlan = _.find(plan.data, function(item) {return item.id === req.query.plan});
                stripe.customers.updateSubscription(currentCustomer.id, currentCustomer.subscriptions.data[0].id, {plan: currentPlan.id}, function(err, subscription) {
                    if (err) {return res.send(500,err);}
                    stripe.charges.create({
                        amount: currentPlan.amount, // amount in cents, again
                        currency: currentPlan.currency,
                        description: req.user.name + " has purchased for " + req.query.plan,
                        customer: currentCustomer.id // Previously stored, then retrieved
                    }, function(err, data) {
                        if (err) {return res.send(500,err);}
                        User.findById(req.user._id, function(err, user) {
                            if (err) {return res.send(500,err);}
                            user.plan = req.query.plan;
                            user.save(function(err, user) {
                                if (err) {return res.send(500,err);}
                                user.isRegistered = true;
                                return res.send(200, user);
                            });
                        });
                    });
                });
            });
        } else {
            return res.send(200, {isRegistered: false});
        }
    });
};

/*Verify phone number for current user*/
exports.verifyPhoneNumber = function(req, res) {
    var user = req.user;
    if (req.body.token.length > 6) {
        return res.send(422, {msg: "Your token is not valid"});
    } else {
        if (user.phoneNumberVerifyToken===req.body.token) {
            user.phoneNumberVerified = true;
        } else {
            return res.send(422, {msg: "Your token is not valid"});
        }
        user.save(function(err) {
            if (err) {return res.send(500,err);}
            return res.send(200);
        });
    }
};

/**
 * Authentication callback
 */
exports.authCallback = function (req, res, next) {
    res.redirect('/');
};
