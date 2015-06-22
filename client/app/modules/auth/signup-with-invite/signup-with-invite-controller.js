angular.module('buiiltApp').controller('SignupWithInviteCtrl', function ($scope,$q,$cookieStore,$state,userService,$stateParams) {
  $scope.user = {
    allowNewsletter: true
  };
  $scope.currentUser = {};
  $scope.errors = {};

  $scope.signup = function () {
    console.log($stateParams);
    if ($stateParams.packageInviteToken) {
      $scope.user.packageInviteToken = $stateParams.packageInviteToken;
    }
    var deferred = $q.defer();
    userService.createUserWithInviteToken($scope.user).$promise.then(function (data) {
      //show alert
      $scope.success = true;
      $scope.user = {
        allowNewsletter: true
      };
      $cookieStore.put('token', data.token);
      $scope.currentUser = userService.get();
      deferred.resolve(data);
      if (data.package.type === 'contractor') {
        $state.go('contractorRequest.sendQuote, ({id:'+ data.package.project +', packageId: '+ data.package._id+'}))';  
      }
      else if (data.package.type === 'material') {
        $state.go('materialRequest.sendQuote, ({id:'+ data.package.project +', packageId: '+ data.package._id+'}))';
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