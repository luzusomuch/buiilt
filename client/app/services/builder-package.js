angular.module('buiiltApp')
.factory('builderPackageService', function($http) {
  var url = '/api/packages/builders/';
  return {
    findDefaultByProject: function(projectId){
      return $http.get(url + '/default?project=' + projectId);
    }
  };
});