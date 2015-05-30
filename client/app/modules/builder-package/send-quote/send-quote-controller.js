angular.module('buiiltApp').controller('SendQuoteCtrl', function($scope, builderPackage, quoteRequetService) {
  $scope.builderPackage = builderPackage;

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
    });
  };
});