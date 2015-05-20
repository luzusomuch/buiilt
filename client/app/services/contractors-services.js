angular.module('buiiltApp')
.factory('contractorService', function(Restangular) {
  var _rest = Restangular.all('api/contractors');
  return{
    get:function(){
      return _rest.get('');
    },
    getModel:function(){
      return _rest.getModel('');
    }
  }
});
