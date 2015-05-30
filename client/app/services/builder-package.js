angular.module('buiiltApp')
.factory('builderPackageService', function($http) {
  var url = '/api/packages/builders/';
  return {
    findDefaultByProject: function(projectId){
      return $http.get(url + '/default?project=' + projectId).then(function(res){ return res.data; });
    },
    /**
     * find single builder package row
     * @param {type} id
     * @returns {unresolved}
     */
    findOne: function(id){
      return $http.get(url + id).then(function(res){ return res.data; });
    }
  };
});