/* global io */
'use strict';
angular.module('buiiltApp')
  .factory('socket', [
    'socketFactory', 'authService',
    function(socketFactory, authService) {

      // socket.io now auto-configures its connection when we ommit a connection url
      var ioSocket = io('', {
        // Send auth token on connection, you will need to DI the Auth service above
        query: 'token=' + authService.getToken(),
        path: '/socket.io-client'
      });

      var socket = socketFactory({
        ioSocket: ioSocket
      });

      return socket;
    }
  ]);
