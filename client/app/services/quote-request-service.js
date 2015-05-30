angular.module('buiiltApp')
.factory('quoteRequetService', function($http) {
  var url = '/api/quoteRequests/';
  return {
    /**
     * send quote request to user
     *
     * @param {Object} data
     * @returns {$promise}
     */
    create: function(data){
      return $http.post(url, data).then(function(res){ return res.data; });
    }
  };
});