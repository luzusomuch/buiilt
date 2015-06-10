angular.module('buiiltApp').controller('SendQuoteBuilderPackageCtrl', function($scope, $state, authService, builderPackage, quoteRequetService) {
  $scope.builderPackage = builderPackage;
  $scope.currentUser = authService.getCurrentUser();
  $scope.user = {};
  /**
   * quote data
   */
  $scope.quote = {
    package: builderPackage._id
  };

  /**
   * submit the quote
   * @returns {undefined}
   */
  $scope.submit = function(){
    quoteRequetService.create($scope.quote).then(function(quote){
      alert('Send quote successfully.');

      //restart new one
      $scope.quote = {
        package: builderPackage._id
      };
    });
  };

  $scope.signin = function () {
    authService.login($scope.user).then(function () {
      //show alert
      $state.reload();
    }, function (res) {
      $scope.errors = res;
    });
  };
});