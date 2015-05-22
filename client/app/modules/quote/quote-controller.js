angular.module('buiiltApp').controller('QuoteCtrl', function($scope, $timeout, $q) {
  
});

angular.module('buiiltApp').controller('FormQuoteCtrl', function($scope, $timeout, $q,$cookieStore,quoteService, userService, project,$stateParams) {
  console.log(project)
    var currentUser = {};
      if ($cookieStore.get('token')) {
        currentUser = userService.get();
      }
    $scope.errors = {};
    $scope.quote = {
      
    };
    $scope.create = function(){
        quoteService.create({_id : $stateParams.id,params : $scope.quote}).$promise.then(function(data){
          //show alert
          $scope.success = true;
          
        }, function(res){
          $scope.errors = res.data;
        });
      };

    $scope.closeAlert = function(key) {
        delete $scope.errors[key];
      };

      $scope.closeSuccess = function(){
        $scope.success = false;
      };
});