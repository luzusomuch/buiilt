'use strict';

var User = require('./../../models/user.model');
var Thread = require('./../../models/thread.model');
var StaffPackage = require('./../../models/staffPackage.model'),
  BuilderPackage = require('./../../models/builderPackage.model'),
  ContractorPackage = require('./../../models/contractorPackage.model'),
  MaterialPackage = require('./../../models/materialPackage.model'),
  Notification = require('./../../models/notification.model'),
  Project = require('./../../models/project.model');
var ThreadValidator = require('./../../validators/thread');
var errorsHelper = require('../../components/helpers/errors');
var _ = require('lodash');
var async = require('async');
var EventBus = require('../../components/EventBus');

var getPackage = function(type) {
  var _package = {};
  switch (type) {
    case 'staff' :
      _package = StaffPackage;
      break;
    case 'builder' :
      _package = BuilderPackage;
      break;
    case 'contractor' :
      _package = ContractorPackage;
      break;
    case 'material' :
      _package = MaterialPackage;
      break;
    default :
      break;
  }
  return _package;
};

exports.project = function(req,res,next) {
  Project.findById(req.params.id,function(err,project) {
    if (err || !project) {
      return res.send(500,err);
    }
    req.project = project;
    next();
  })
};

exports.package = function(req,res,next) {
  var _package = getPackage(req.params.type);
  _package.findById(req.params.id,function(err,aPackage) {
    if (err || !aPackage) {
      return res.send(500,err);
    }
    req.aPackage = aPackage;
    next();
  })
};

exports.thread = function(req,res,next) {
  Thread.findById(req.params.id,function(err,thread) {
    if (err || !thread) {
      return res.send(500,err)
    }
    req.thread = thread;
    next();
  })
};

exports.getOne = function(req,res) {
  var thread = req.thread;
  Thread.populate(thread,{path : 'messages.user'},function(err,thread) {
    return res.json(thread);
  })
};

exports.myThread = function(req,res) {
  var user = req.user;
  var project = req.project;
  var result = [];
  var query = Notification.find(
    {owner : user._id,unread : true, referenceTo : 'thread','element.project' : project._id }
  );
  query.distinct('element._id');

  query.exec(function(err, threads) {

    async.each(threads,function(thread,callback) {
      Thread.findById(thread)
        .populate('messages.user')
        .exec(function(err,thread) {
          Notification.where({owner : user._id,'element._id' : thread._id,referenceTo : 'thread',unread : true}).count(function(err,count) {
            thread.__v = count;
            result.push(thread);
            callback();
          }) ;
        })
    },function() {

        return res.json(result);

    })
  })
};

exports.create = function(req,res) {
  var aPackage = req.aPackage;
  var user = req.user;
  ThreadValidator.validateCreate(req,function(err,data) {
    if (err) {
      return errorsHelper.validationErrors(res,err)
    }
    var thread = new Thread(data);
    thread.package = aPackage;
    thread.project = aPackage.project;
    thread.owner = user;
    thread.type = req.params.type;
    thread.save(function(err) {
      if (err) {
        return res.send(500,err)
      }
      return res.json(thread);
    })
  })
};

exports.update = function(req,res) {
  var thread = req.thread;
  var user = req.user;
  ThreadValidator.validateUpdate(req,function(err,data) {
    if (err) {
      return errorsHelper.validationErrors(res,err)
    }

    thread = _.merge(thread,data);
    thread.users = data.users;
    thread.markModified('users');
    thread._editUser = req.user;
    thread.save(function(err) {
      if (err) {
        return res.send(500,err)
      }
      return res.json(true);
    })
  })
};

exports.saveMessage = function(req,res) {
  var thread = req.thread;
  var user = req.user;
  ThreadValidator.validateMessage(req,function(err,data) {
    var message = {
      text : data.text,
      user : user
    };
    thread.messages.push(message);
    thread._evtName = 'Thread.NewMessage';
    thread._message = message;
    thread.save(function(err) {
      if (err) {
        return res.send(422,err);
      }
      Thread.populate(thread,[
        {path : 'users'},
        {path : 'messages.user'}
      ],function(err,thread) {
        if (err) {
          return res.send(422,err);
        }
        EventBus.emit('socket:emit', {
          event: 'message:new',
          room: thread._id.toString(),
          data: thread
        });
        //EventBus.emit('socket:emit', {
        //  event: 'message:new',
        //  room: thread.owner.toString(),
        //  data: thread
        //});
        return res.json(thread)
      })

    })
  })
};

exports.getMessages = function(req,res) {
  var aPackage = req.aPackage;
  Thread.find({package : aPackage})
    .populate('users')
    .populate('messages.user')
    .exec(function(err,threads) {
      if (err) {
        return res.send(500,err);
      }
      return res.json(threads);
    });
};


