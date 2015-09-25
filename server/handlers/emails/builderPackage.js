var _ = require('lodash');
'use strict';

var Mailer = require('./../../components/Mailer');
var EventBus = require('./../../components/EventBus');
var Project = require('./../../models/project.model');
var Team = require('./../../models/team.model');
var User = require('./../../models/user.model');
var BuilderPackage = require('./../../models/builderPackage.model');
var PackageInvite = require('./../../models/packageInvite.model');
var config = require('./../../config/environment');
var async = require('async');

EventBus.onSeries('BuilderPackage.Updated', function(request, next){
  if (request._modifiedPaths.indexOf('inviteBuilder') != -1) {
    async.parallel({
      team: function(cb) {
        Team.findById(request.owner, cb);
      },
      project: function(cb){
        Project.findById(request.project, cb);
      },
      user: function(cb) {
        User.findById(request.editUser, cb)
      }
    },function(err,result){
      if (err) {return next();}
      var from = result.user.firstName + " " + result.user.lastName + " | " + result.team.name + "<"+result.user.email+">";
      async.each(request.newInvitees, function(invitee, cb){
        if (!invitee._id) {
          var packageInvite = new PackageInvite({
            owner: request.owner,
            project: request.project,
            package: request._id,
            inviteType : 'builder',
            to: invitee.email,
            user: result.user._id
          });
          packageInvite.save(function(err,saved){
            if (err) {return cb(err);}
            Mailer.sendMail('invite-builder-has-no-account.html', from, saved.to, {
              user: result.user.toJSON(),
              project: result.project.toJSON(),
              team: result.team.toJSON(),
              registryLink : config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
              subject: 'Join ' + result.project.name + ' on buiilt'
            },function(){
             return cb();
            });
          })
        } else {
          Team.findById(request.to.team)
          .populate('leader')
          .exec(function(err, team) {
            if(err || !team){ return cb(err); }
            async.each(team.leader, function(leader, cb) {
              Mailer.sendMail('invite-builder.html', from, leader.email, {
                user: result.user.toJSON(),
                project: result.project.toJSON(),
                team: result.team.toJSON(),
                link: config.baseUrl + request.project + '/dashboard',
                subject: 'Join ' + result.project.name + ' on buiilt'
              }, function () {
                return cb();
              });
            }, function(){return cb();})
          });
        }
      }, function() {return next();});
    });
  } else {
    return next();
  }
});

EventBus.onSeries('BuilderPackage.Inserted', function(request, next) {
  async.parallel({
    team: function(cb) {
      Team.findById(request.owner, cb);
    },
    project: function(cb){
      Project.findById(request.project, cb);
    },
    user: function(cb) {
      User.findById(request.editUser, cb)
    }
  },function(err,result){
    if (err) {return next();}
    var from = result.user.firstName + " " + result.user.lastName + " | " + result.team.name + "<"+result.user.email+">";
    // var subjectType = (request.to.type == 'homeOwner') ? 'homeowner' : 'builder';
    if (request.to.type == 'homeOwner' && (request.architect.email || request.architect.team)) {
      console.log('in first');
      async.parallel([
        function(cb) {
          if (request.architect.email) {
            var packageInvite = new PackageInvite({
              owner: request.owner,
              project: request.project,
              package: request._id,
              inviteType : 'architect',
              to: request.architect.email,
              user: result.user._id
            });
            packageInvite.save(function(err) {
              if(err){ cb(); }
              Mailer.sendMail('invite-architect-has-no-account.html', from, request.architect.email, {
                user: result.user.toJSON(),
                project: result.project.toJSON(),
                team: result.team.toJSON(),
                registryLink : config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                subject: 'Join ' + result.project.name + ' on buiilt'
              },function(){
               return cb();
              });
            });
          }
          else {
            Team.findById(request.architect.team)
            .populate('leader')
            .exec(function(err, team) {
              if(err || !team){ cb(); }
              team.leader.forEach(function(leader) {
                Mailer.sendMail('invite-architect.html', from, leader.email, {
                  user: result.user.toJSON(),
                  project: result.project.toJSON(),
                  team: result.team.toJSON(),
                  link: config.baseUrl + request.project + '/dashboard',
                  subject: 'Join ' + result.project.name + ' on buiilt'
                }, function () {
                  return cb();
                });
              });
            });
          }
        },
        function(cb) {
          if (request.to.email) {
            var packageInvite = new PackageInvite({
              owner: request.owner,
              project: request.project,
              package: request._id,
              inviteType : request.to.type,
              to: request.to.email,
              user: result.user._id
            });
            packageInvite.save(function(err) {
              if(err){ cb(); }
              Mailer.sendMail('invite-homeowner-has-no-account.html', from, request.to.email, {
                user: result.user.toJSON(),
                project: result.project.toJSON(),
                team: result.team.toJSON(),
                registryLink : config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
                subject: 'Join ' + result.project.name + ' on buiilt'
              },function(){
               return cb();
              });
            });
          }
          else {
            Team.findById(request.to.team)
            .populate('leader')
            .exec(function(err, team) {
              if(err || !team){ cb(); }

              team.leader.forEach(function(leader) {
                Mailer.sendMail('invite-homeowner.html', from, leader.email, {
                  user: result.user.toJSON(),
                  project: result.project.toJSON(),
                  team: result.team.toJSON(),
                  link: config.baseUrl + request.project + '/dashboard',
                  subject: 'Join ' + result.project.name + ' on buiilt'
                }, function (err) {
                  return cb();
                });
              });
            });
          }
        }
        ], function(){
          return next();
        });
      
      
    }
    else if (request.to.type == 'homeOwner') {
      console.log('in homeowner');
      // subjectType = 'homeowner';
      if (request.to.email) {
        var packageInvite = new PackageInvite({
          owner: request.owner,
          project: request.project,
          package: request._id,
          inviteType : request.to.type,
          to: request.to.email,
          user: result.user._id
        });
        packageInvite.save(function(err) {
          if(err){ next(); }
          Mailer.sendMail('invite-homeowner-has-no-account.html', from, request.to.email, {
            user: result.user.toJSON(),
            project: result.project.toJSON(),
            team: result.team.toJSON(),
            registryLink : config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
            subject: 'Join ' + result.project.name + ' on buiilt'
          },function(){
           return next();
          });
        });
      } else {
        Team.findById(request.to.team)
        .populate('leader')
        .exec(function(err, team) {
          if(err || !team){ next(); }

          // if (result.team.type == request.to.type) {
            team.leader.forEach(function(leader) {
              Mailer.sendMail('invite-homeowner.html', from, leader.email, {
                user: result.user.toJSON(),
                project: result.project.toJSON(),
                team: result.team.toJSON(),
                link: config.baseUrl + request.project + '/dashboard',
                subject: 'Join ' + result.project.name + ' on buiilt'
              }, function (err) {
                return next();
              });
            });
          // }else{
          //   return next();
          // }
        });
      }
    } else if (request.to.type == 'builder' || request.winner) {
      console.log('in builder');
      // subjectType = 'builder';
      if (request.to.email) {
        var packageInvite = new PackageInvite({
          owner: request.owner,
          project: request.project,
          package: request._id,
          inviteType : 'builder',
          to: request.to.email,
          user: result.user._id
        });
        packageInvite.save(function(err) {
          if(err){ next(); }
          Mailer.sendMail('invite-builder-has-no-account.html', from, request.to.email, {
            user: result.user.toJSON(),
            project: result.project.toJSON(),
            team: result.team.toJSON(),
            registryLink : config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
            subject: 'Join ' + result.project.name + ' on buiilt'
          },function(){
           return next();
          });
        });
      } else {
        Team.findById(request.to.team)
          .populate('leader')
          .exec(function(err, team) {
            if(err || !team){ next(); }

            // if (result.team.type == request.to.type) {
              team.leader.forEach(function(leader) {
                Mailer.sendMail('invite-builder.html', from, leader.email, {
                  user: result.user.toJSON(),
                  project: result.project.toJSON(),
                  team: result.team.toJSON(),
                  link: config.baseUrl + request.project + '/dashboard',
                  subject: 'Join ' + result.project.name + ' on buiilt'
                }, function () {
                  return next();
                });
              });
            // }else{
            //   return next();
            // }
        });
      }
    } else if(request.architect.team || request.architect.email) {
      console.log('in architect');
      // subjectType = 'architect'
      if (request.architect.email) {
        var packageInvite = new PackageInvite({
          owner: request.owner,
          project: request.project,
          package: request._id,
          inviteType : 'architect',
          to: request.architect.email,
          user: result.user._id
        });
        packageInvite.save(function(err) {
          if(err){ next(); }
          Mailer.sendMail('invite-architect-has-no-account.html', from, request.architect.email, {
            user: result.user.toJSON(),
            project: result.project.toJSON(),
            team: result.team.toJSON(),
            registryLink : config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
            subject: 'Join ' + result.project.name + ' on buiilt'
          },function(){
           return next();
          });
        });
      } else {
        Team.findById(request.architect.team)
          .populate('leader')
          .exec(function(err, team) {
            if(err || !team){ next(); }
            team.leader.forEach(function(leader) {
              Mailer.sendMail('invite-architect.html', from, leader.email, {
                user: result.user.toJSON(),
                project: result.project.toJSON(),
                team: result.team.toJSON(),
                link: config.baseUrl + request.project + '/dashboard',
                subject: 'Join ' + result.project.name + ' on buiilt'
              }, function () {
                return next();
              });
            });
        });
      }
    } else {
      return next();
    }

    // if (request.to.email) {
    //   var packageInvite = new PackageInvite({
    //     owner: request.owner,
    //     project: request.project,
    //     package: request._id,
    //     inviteType : request.to.type,
    //     to: request.to.email,
    //     user: result.user._id
    //   });
    //   packageInvite.save(function(err) {
    //     if(err){ next(); }
    //     Mailer.sendMail('invite-' + subjectType + '-has-no-account.html', from, request.to.email, {
    //       user: result.user.toJSON(),
    //       project: result.project.toJSON(),
    //       team: result.team.toJSON(),
    //       registryLink : config.baseUrl + 'signup-invite?packageInviteToken=' + packageInvite._id,
    //       subject: 'Join ' + result.project.name + ' on buiilt'
    //     },function(){
    //      return next();
    //     });
    //   });
    // } else {
    //   Team.findById(request.to.team)
    //     .populate('leader')
    //     .exec(function(err, team) {
    //       if(err || !team){ next(); }

    //       if (result.team.type == request.to.type) {
    //         team.leader.forEach(function(leader) {
    //           Mailer.sendMail('invite-' + subjectType + '.html', from, leader.email, {
    //             user: result.user.toJSON(),
    //             project: result.project.toJSON(),
    //             team: result.team.toJSON(),
    //             link: config.baseUrl + request.project._id + '/dashboard',
    //             subject: 'Join ' + result.project.name + ' on buiilt'
    //           }, function () {
    //             return next();
    //           });
    //         });
    //       }else{
    //         return next();
    //       }
    //   });
    // }
  });
});