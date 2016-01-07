'use strict';

var User = require('./../../models/user.model');
var Team = require('./../../models/team.model');
var Thread = require('./../../models/thread.model');
var StaffPackage = require('./../../models/staffPackage.model'),
  BuilderPackage = require('./../../models/builderPackage.model'),
  ContractorPackage = require('./../../models/contractorPackage.model'),
  MaterialPackage = require('./../../models/materialPackage.model'),
  Variation = require('./../../models/variation.model'),
  Notification = require('./../../models/notification.model'),
  Project = require('./../../models/project.model'),
  PeopleChat = require('./../../models/peopleChat.model'),
  Board = require('./../../models/board.model'),
  Design = require('./../../models/design.model');
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
        case 'variation' :
            _package = Variation;
        case 'design':
            _package = Design;
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
    });
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

exports.create = function(req,res) {
    var user = req.user;
    ThreadValidator.validateCreate(req,function(err,data) {
        if (err) {
            return errorsHelper.validationErrors(res,err)
        }
        var thread = new Thread(data);
        thread.project = req.params.id;
        thread.owner = user._id;
        thread.element = {type: req.body.type};
        thread.save(function(err){
            if (err) {return res.send(500,err);}
            return res.json(thread);
        });
    });
};

exports.getProjectThread = function(req, res) {
    Thread.find({project: req.params.id, 'element.type': 'project-message', $or:[{owner: req.user._id},{members: req.user._id}]})
    .populate('members', '_id name email')
    .populate('owner', '_id name email')
    .exec(function(err, threads) {
        if (err) {return res.send(500,err);}
        return res.send(200, threads);
    });
};

exports.getById = function(req, res){
    Thread.findById(req.params.id)
    .populate('messages.user','_id name email')
    .populate('messages.mentions','_id name email')
    .populate('members','_id name email')
    .populate('owner','_id name email')
    .exec(function(err, thread){
        if (err) {return res.send(500,err);}
        else if (!thread) {return res.send(404);}
        else {
            return res.json(thread);
        }
    });
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
  var result = [];
  var query = Notification.find(
    {owner : user._id,unread : true, $or:[{referenceTo : 'thread'},{type: 'chat'}]}
  );
  query.exec(function(err, threads) {
    if (err) {return res.send(500,err);}
    async.each(threads,function(thread,callback) {
      if (thread.referenceTo == 'people-chat') {
        PeopleChat.findById(thread.element._id)
        .populate('messages.user', '-hashedPassword -salt')
        .populate('from', '-hashedPassword -salt')
        .populate('project')
        .exec(function(err, thread){
          if (err || !thread) {return callback();}
          else {
            Notification.where({owner : user._id,'element._id' : thread._id,referenceTo : 'people-chat',unread : true}).count(function(err,count) {
              thread.__v = count;
              result.push(thread);
              callback();
            });
          }
        });
      } else if (thread.referenceTo == 'board-chat') {
        Board.findById(thread.element._id)
        .populate('messages.user', '-hashedPassword -salt')
        .populate('project')
        .exec(function(err, thread){
          if (err || !thread) {return callback();}
          else {
            Notification.where({owner : user._id,'element._id' : thread._id,referenceTo : 'board-chat',unread : true}).count(function(err,count) {
              thread.__v = count;
              result.push(thread);
              callback();
            });
          }
        });
      } else {
        Thread.findById(thread)
        .populate('messages.user','-hashedPassword -salt')
        .populate('users','-hashedPassword -salt')
        .exec(function(err,thread) {
          if (err || !thread) {return callback(err);}
          Notification.where({owner : user._id,'element._id' : thread._id,referenceTo : 'thread',unread : true}).count(function(err,count) {
            thread.__v = count;
            result.push(thread);
            callback();
          });
        });
      }
    },function() {
        return res.json(result);
    })
  })
};



exports.update = function(req,res) {
    var user = req.user;
    Thread.findById(req.params.id, function(err, thread) {
        if (err) {return res.send(500,err);}
        else if (!thread) {return res.send(404, "The specific message is not existed");}
        else {
            ThreadValidator.validateUpdate(req,function(err,data) {
                if (err) {
                    return errorsHelper.validationErrors(res,err)
                } else {
                    thread = _.merge(thread,data);
                    thread.users = data.users;
                    thread.markModified('users');
                    thread._editUser = req.user;
                    thread.save(function(err) {
                      if (err) {
                        return res.send(500,err)
                      }
                      return res.json(thread);
                    });
                }
            });
        }
    })
};

exports.sendMessage = function(req,res) {
    var user = req.user;
    Thread.findById(req.params.id, function(err, thread) {
        if (err) {return res.send(500,err);}
        else if (!thread) {return res.send(404, "The specific thread is not existed");}
        else {
            ThreadValidator.validateMessage(req,function(err,data) {
                var message = {
                    text : data.text,
                    user : user,
                    sendAt: new Date()
                };
                thread.messages.push(message);
                thread._evtName = 'Thread.NewMessage';
                thread._message = message;
                thread.save(function(err) {
                    if (err) {
                        return res.send(422,err);
                    } else {
                        Thread.populate(thread,[
                            {path : 'members', select: '_id email name'},
                            {path : 'messages.user', select: '_id email name'},
                            {path : 'messages.mentions', select: '_id email name'},
                            {path : 'owner', select: '_id email name'}
                        ],function(err,thread) {
                            if (err) {
                                return res.send(422,err);
                            } else {
                                EventBus.emit('socket:emit', {
                                  event: 'message:new',
                                  room: thread._id.toString(),
                                  data: thread
                                });
                                return res.json(thread)
                            }
                        });
                    }
                });
            });
        }
    });
};

exports.getMessages = function(req,res) {
  var aPackage = req.aPackage;
  Thread.find({package : aPackage},{messages: 0})
    .populate('users')
    .populate('messages.user')
    .exec(function(err,threads) {
      if (err) {
        return res.send(500,err);
      }
      return res.json(threads);
    });
};

exports.getMessagesIos = function(req,res) {
  var aPackage = req.aPackage;
  var result = [];
  Thread.find({package : aPackage})
    .populate('users')
    .populate('messages.user')
    .exec(function(err,threads) {
      if (err) {
        return res.send(500,err);
      }
      async.each(threads, function(thread,cb){
        var query = Notification.find(
          {owner : req.user._id,unread : true, referenceTo : 'thread','element._id' : thread._id }
        );
        query.distinct('element._id');

        query.exec(function(err, threadNotifications) {
          if (err) {return cb(err);}
          if (threadNotifications.length > 0) {
            _.each(threadNotifications, function(threadNotification){
              if (thread._id.toString() == threadNotification.toString()) {
                thread.isNewNotification = true;
                result.push(thread);
                cb();
              }
            });
          }
          else {
            result.push(thread);
            cb();
          }
        });
      }, function(err){
        if (err) {return res.send(500,err);}
        return res.json(result);
      });
    });
};

exports.getThreadById = function(req, res){
  Thread.findById(req.params.id).populate('messages.user').exec(function(err, thread){
    if (err) {return res.send(500,err);}
    if (!thread) {return res.send(404);}
    return res.send(200,thread);
  });
};

exports.getAll = function(req, res){
  Thread.find({})
  .populate('owner')
  .populate('users').exec(function(err, threads){
    if (err) {return res.send(500,err);}
    return res.send(200,threads);
  })
};

exports.destroy = function (req, res) {
  Thread.findByIdAndRemove(req.params.id, function (err, thread) {
    if (err) {
      return res.send(500, err);
    }
    Thread.find({}, function(err,threads){
      if (err) {return res.send(500,err);}
      return res.send(200, threads);
    })
  });
};

exports.getByPackage = function(req, res){
  Thread.find({package: req.params.id, type: req.params.type})
  .populate('owner')
  .populate('users').exec(function(err, threads){
    if (err) {return res.send(500,err);}
    if (!threads) {return res.send(404);}
    return res.send(200,threads);
  });
};

exports.getAllByUser = function(req, res) {
  Thread.find({$or:[{owner: req.user._id},{users: req.user._id}]})
  .populate('owner')
  .populate('users').exec(function(err, threads){
    if (err) {return res.send(500,err);}
    return res.send(200,threads);
  });
};

exports.getAllByProject = function(req, res) {
  Thread.find({project: req.params.id})
  .populate('owner')
  .populate('users').exec(function(err, threads){
    if (err) {return res.send(500,err);}
    return res.send(200,threads);
  });
};


exports.replyMessage = function(req, res) {
  var splited = req.body.recipient.split("-");
  var messageType = splited[1].substr(0,splited[1].lastIndexOf("@"));

  if (messageType =="people") {
    PeopleChat.findById(splited[0], function(err, peopleChat) {
      if (err) {return res.send(500,err);}
      if (!peopleChat) {return res.send(404);}
      User.findOne({email: req.body.sender}, function(err, user){
        if (err) {return res.send(500,err);}
        if (!user) {
          peopleChat.messages.push({
            email: req.body.sender,
            text: req.body['stripped-text'],
            mentions: [],
            sendAt: new Date()
          });
          peopleChat._editUser = {email: req.body.sender};
        } else {
          peopleChat.messages.push({
            email: user._id,
            text: req.body['stripped-text'],
            mentions: [],
            sendAt: new Date()
          });
          peopleChat._editUser = user;
        }
      });
      setTimeout(function() {
        peopleChat.messageType = "replyMessage";
        peopleChat.save(function(err){
          if (err) {return res.send(500,err);}
          PeopleChat.populate(peopleChat, 
          [{path: "messages.user", select: "_id email name"},
          {path: "messages.mentions", select: "_id email name"}], function(err, peopleChat) {
              EventBus.emit('socket:emit', {
                  event: 'peopleChat:new',
                  room: peopleChat._id.toString(),
                  data: peopleChat
              });
              return res.json(peopleChat);
          });
        });
      }, 2000);
    });
  } else {
    Board.findById(splited[0], function(err,board){
      if (err) {return res.send(500,err);}
      if (!board) {return res.send(404);}
      else {
        User.findOne({email: req.body.sender}, function(err, user){ 
          if (err) {return res.send(500,err);}
          else {
            board.messages.push({
              user: user._id,
              text: req.body['stripped-text'],
              mentions: [],
              sendAt: new Date()
            });
            board._editUser = user;
            board.markModified('sendMessage');
            board.messageType = "replyMessage";
            board.save(function(err){
              if (err) {return res.send(500,err);}
                Board.populate(board, [
                {path: 'invitees._id', select: '_id email name'},
                {path: 'owner', select: '_id email name'},
                {path: 'messages.user', select: '_id email name'},
                {path: 'messages.mentions', select: '_id email name'}
                ], function(err, board) {
                  EventBus.emit('socket:emit', {
                    event: 'boardChat:new',
                    room: board._id.toString(),
                    data: board
                  });
                  return res.send(200, board);
                });
              });
            }
        });
      }
    });
  }
};