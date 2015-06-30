'use strict';

var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var NotificationHelper = require('./../components/helpers/notification');
var Notification = require('./../models/notification.model');
var config = require('./../config/environment');
var async = require('async');
var _ = require('lodash');

EventBus.onSeries('Team.Inserted', function(team, next){
  if (team.member.length > 0) {
     var owners = [];
     team.member.forEach(function(member) {
       if (member._id)  {
         owners.push(member._id)
       }
     });
     var params = {
       owners : owners,
       fromUser : team.leader[0],
       element : team,
       referenceTo : 'team',
       type : 'team-invite'
    };
    NotificationHelper.create(params,function(err) {
      if (err) {
        console.log(err);
      }
      next();
    });
  } else {
    next();
  }
});



EventBus.onSeries('Team.Updated', function(team, next){
  if (team.member.length > 0) {
    var owners = [];
    team.member.forEach(function(member) {
      if (member._id && !(_.find(team.oldMember,{ _id : member._id})))  {
        owners.push(member._id)
      }
      else {
        next();
      }
    });
    var params = {
      owners : owners,
      fromUser : team.user,
      element : team,
      referenceTo : 'team',
      type : 'team-invite'
    };
    NotificationHelper.create(params,function() {
      next();
    });
  } else {
    return next();
  }
});

EventBus.onSeries('Team.MemberRemoved', function(team, next) {
  if (team.member.length > 0 && team.toUser.status == 'Active') {
    var toUser = team.toUser._id;
    var owners = team.leader.slice();
    _.forEach(team.member, function (member) {
      if (member.status == 'Active') {
        owners.push(member._id);
      }
    });
    owners.push(toUser);
    var params = {
      owners: owners,
      fromUser: team.user,
      toUser: toUser._id,
      element: team,
      referenceTo: 'team',
      type: 'team-remove'
    };
    NotificationHelper.create(params, function (err) {
      if (err) {
        console.log(err);
      }
      next();
    });
  } else {
    next();
  }
});

EventBus.onSeries('Team.Accepted', function(team, next) {
  var owners = team.leader.slice();
  _.forEach(team.member,function(member) {
    if (member.status == 'Active') {
      owners.push(member._id);
    }
  });
  _.remove(owners,{_id : team.user._id})
  var params = {
    owners : owners,
    fromUser : team.user,
    element : team,
    referenceTo : 'team',
    type : 'team-accept'
  };
  NotificationHelper.create(params,function(err) {
    if (err) {
      console.log(err);
    }
    next();
  });
});

EventBus.onSeries('Team.Rejected', function(team, next) {
  var owners = team.leader.slice();
  _.forEach(team.member,function(member) {
    if (member.status == 'Active') {
      owners.push(member._id);
    }
  });
  var params = {
    owners : owners,
    fromUser : team.user,
    element : team,
    referenceTo : 'team',
    type : 'team-reject'
  };
  NotificationHelper.create(params,function(err) {
    if (err) {
      console.log(err);
    }
    next();
  });
});

EventBus.onSeries('Team.Leaved', function(team, next) {
  var owners = team.leader.slice();
  _.forEach(team.member,function(member) {
    if (member.status == 'Active') {
      owners.push(member._id);
    }
  });
  owners.push(team.user);
  var params = {
    owners : owners,
    fromUser : team.user,
    element : team,
    referenceTo : 'team',
    type : 'team-leave'
  };
  NotificationHelper.create(params,function(err) {
    if (err) {
      console.log(err);
    }
    next();
  });
});

EventBus.onSeries('Team.LeaderAssigned', function(team, next) {
  var owners = team.leader.slice();
  var toUser = team.toUser._id;
  _.forEach(team.member,function(member) {
    if (member.status == 'Active') {
      owners.push(member._id);
    }
  });
  var params = {
    owners : owners,
    fromUser : team.user,
    to : toUser._id,
    element : team,
    referenceTo : 'team',
    type : 'team-assign-leader'
  };
  console.log(params);
  NotificationHelper.create(params,function(err) {
    if (err) {
      console.log(err);
    }
    next();
  });
});