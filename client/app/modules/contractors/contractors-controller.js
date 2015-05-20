angular.module('buiiltApp').controller('ContractorsCtrl', function($scope, contractors, $timeout, $q) {
  console.log(contractors);
});

angular.module('buiiltApp').controller('FormContractorsCtrl', function($scope, $timeout, $q) {
  $scope.contractor = {};
  $scope.save = function() {
    console.log($scope.contractor);
  }

  $scope.readonly = false;
  $scope.selectedItem = null;
  $scope.searchText = null;
  $scope.querySearch = querySearch;
  $scope.vegetables = loadVegetables();
  $scope.selectedVegetables = [];
  $scope.numberChips = [];
  $scope.numberChips2 = [];
  $scope.numberBuffer = '';
  /**
   * Search for vegetables.
   */
  function querySearch(query) {
    var results = query ? $scope.vegetables.filter(createFilterFor(query)) : [];
    return results;
  }
  /**
   * Create filter function for a query string
   */
  function createFilterFor(query) {
    var lowercaseQuery = angular.lowercase(query);
    return function filterFn(vegetable) {
      return (vegetable._lowername.indexOf(lowercaseQuery) === 0) ||
              (vegetable._lowertype.indexOf(lowercaseQuery) === 0);
    };
  }
  
  function loadVegetables() {
    var veggies = [
      {
        'name': 'Broccoli',
        'type': 'Brassica'
      },
      {
        'name': 'Cabbage',
        'type': 'Brassica'
      },
      {
        'name': 'Carrot',
        'type': 'Umbelliferous'
      },
      {
        'name': 'Lettuce',
        'type': 'Composite'
      },
      {
        'name': 'Spinach',
        'type': 'Goosefoot'
      }
    ];
    return veggies.map(function(veg) {
      veg._lowername = veg.name.toLowerCase();
      veg._lowertype = veg.type.toLowerCase();
      return veg;
    });
  }
});
