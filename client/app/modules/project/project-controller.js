angular.module('buiiltApp').controller('ProjectCtrl', function($scope, $timeout, $q, projectService) {
  $scope.errors = {};
  $scope.projects = {};
  projectService.index().$promise.then(function(data) {
    $scope.projects = data;
  }, function(res) {
    $scope.errors = res.data;
  })
});

angular.module('buiiltApp').controller('FormProjectCtrl', function($scope, $timeout, $q,$cookieStore,projectService, userService) {

    var currentUser = {};
      if ($cookieStore.get('token')) {
        currentUser = userService.get();
      }
    $scope.errors = {};
    $scope.project = {
        location : {},
        requestedHomeBuilders: []
    };
    $scope.create = function(){
      console.log($scope.project.requestedHomeBuilders.email);
        projectService.create($scope.project).$promise.then(function(data){
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

angular.module('buiiltApp').controller('ViewProjectCtrl', function($scope, $timeout, $q, projectService, project) {
  $scope.errors = {};
  $scope.project=project;
  $scope.sendQuote = function() {
    $scope.project.$update(function(data){
      console.log(data);
    })
  };

  $scope.closeAlert = function (key) {
    delete $scope.errors[key];
  };

  $scope.closeSuccess = function () {
    $scope.success = false;
  };
});