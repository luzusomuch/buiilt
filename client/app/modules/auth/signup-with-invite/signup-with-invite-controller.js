angular.module('buiiltApp').controller('SignupWithInviteCtrl', function ($scope,authService,$q,$cookieStore,$state,userService,$stateParams) {
  $scope.user = {
    allowNewsletter: true
  };
  $scope.currentUser = {};
  $scope.errors = {};

  $scope.signup = function () {
    if ($stateParams.packageInviteToken) {
      $scope.user.packageInviteToken = $stateParams.packageInviteToken;
    }
    var deferred = $q.defer();
    userService.createUserWithInviteToken($scope.user).$promise.then(function (data) {
      //show alert
      console.log(data);
      $scope.success = true;
      $scope.user = {
        allowNewsletter: true
      };
      $cookieStore.put('token', data.token);
      authService.isLoggedInAsync(function(isLoggedIn){
        if (isLoggedIn) {
          $scope.user = authService.getCurrentUser();
          console.log($scope.user);
        }
      });
      $scope.currentUser = userService.get();
      deferred.resolve(data);
      if (data.package.type === 'contractor') {
        $state.go('contractorRequest.sendQuote', {id:data.package.project, packageId: data.package._id});  
      }
      else if (data.package.type === 'material') {
        $state.go('materialRequest.sendQuote', {id: data.package.project, packageId: data.package._id});
      }
      else if (data.package.type === 'BuilderPackage') {
        $state.go('builderPackages.sendQuote', {id: data.package.project, packageId: data.package._id});
      }
    }, function (res) {
      $scope.errors = res.data;
    });
  };

  $scope.closeAlert = function (key) {
    delete $scope.errors[key];
  };

  $scope.closeSuccess = function () {
    $scope.success = false;
  };
});