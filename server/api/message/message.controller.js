'use strict';

var User = require('./../../models/user.model');
var Thread = require('./../../models/thread.model');
var StaffPackage = require('./../../models/staffPackage.model'),
  BuilderPackage = require('./../../models/builderPackage.model'),
  ContractorPackage = require('./../../models/contractorPackage.model'),
  MaterialPackage = require('./../../models/materialPackage.model');
var ThreadValidator = require('./../../validators/thread');
var errorsHelper = require('../../components/helpers/errors');
var _ = require('lodash');
var async = require('async');

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
