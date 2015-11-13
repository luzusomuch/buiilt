  /**
 * Socket.io configuration
 */

'use strict';

var config = require('./environment');
var path = require('path');
var fs = require('fs');
var EventBus = require('./../components/EventBus');
var User = require('./../models/user.model');
var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var listOnlineUser = [];
var listOfUserOnline = [];
var uniqueUserList = [];

function _parse(initPath, callback) {

  fs.readdirSync(initPath).forEach(function(name) {

    var itemPath = path.join(initPath, name)
      , stat = fs.statSync(itemPath);

    if (stat && stat.isDirectory(itemPath)) {

      //recursive dir reading
      _parse(itemPath, callback);

    } else {
      callback(itemPath, name);
    }

	});
}

// When the user disconnects.. perform this
function onDisconnect(socket) {
  EventBus.removeListener('toSocket.voiceIncomming', function(){});

  //socket.leave(socket.decoded_token._id);
}

// When the user connects.. perform this
function onConnect(socket) {
  //global
  //socket.join(config.app.name);
  //user room
  //socket.join(socket.decoded_token._id);

  // When the client emits 'info', this listens and executes
  socket.on('info', function (data) {
    console.info('[%s] %s', socket.address, JSON.stringify(data, null, 2));
  });

  socket.on('join', function (id) {
    console.log('user join room [%s] socket id [%s]', id, socket.id);
    socket.userId = id;
    socket.join(id);
    listOnlineUser.push(socket.userId);
    uniqueUserList = _.uniq(listOnlineUser);
    _.each(uniqueUserList, function(user){
      EventBus.emit('socket:emit', {
        event: 'onlineUser',
        room: user,
        data: uniqueUserList
      });
    });
  });

  //new TwilioSocket(socket);

  // EventBus handlers with sockets
  _parse(path.join(__dirname, '..', 'handlers', 'sockets'), function(itemPath, name) {
    require(itemPath)(socket);
  });
  //
  //
  //require('../api/thing/thing.socket').register(socket);
}

module.exports = function (socketio) {
  // socket.io (v1.x.x) is powered by debug.
  // In order to see all the debug output, set DEBUG (in server/config/local.env.js) to including the desired scope.
  //
  // ex: DEBUG: "http*,socket.io:socket"

  // We can authenticate socket.io users and access their token through socket.handshake.decoded_token
  //
  // 1. You will need to send the token in `client/components/socket/socket.service.js`
  //
  // 2. Require authentication here:
  // socketio.use(require('socketio-jwt').authorize({
  //   secret: config.secrets.session,
  //   handshake: true
  // }));
  
  socketio.on('connection', function (socket) {
    socket.address = socket.handshake.address !== null ?
            socket.handshake.address + ':9000' :
            process.env.DOMAIN;

    socket.connectedAt = new Date();

    // Call onDisconnect.
    socket.on('disconnect', function () {
      onDisconnect(socket);
      console.info('[%s] DISCONNECTED', socket.address);
      if (socket.userId) {
        var abc = _.remove(uniqueUserList, function(item){
          return item == socket.userId.toString();
        });
        _.each(uniqueUserList, function(user) {
          EventBus.emit('socket:emit', {
            event: 'onlineUser',
            room: user,
            data: uniqueUserList
          });
        });
      }
    });

    // Call onConnect.
    onConnect(socket);
    console.info('[%s] CONNECTED', socket.address);
  });

  EventBus.on('socket:emit',function(payload) {
    if (!payload.event) {
      return;
    }
    if (payload.room) {
      socketio.sockets.in(payload.room).emit(payload.event, payload.data);
    } else {
      socketio.sockets.emit(payload.event, payload.data);
    }
  })
};