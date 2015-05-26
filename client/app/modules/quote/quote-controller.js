angular.module('buiiltApp').controller('QuoteCtrl', function($scope, $timeout, $q, userService, quoteService, projectService) {
  $scope.errors = {};
  $scope.projects = {};
  $scope.quoteRequests = {};
  $scope.user = {};
  projectService.index().$promise.then(function(data) {
    $scope.projects = data;
  }, function(res) {
    $scope.errors = res.data;
  });
  quoteService.index().$promise.then(function(data) {
    $scope.quoteRequests = data;
    _.each(data, function(quote) {
      userService.get({'_id': quote.user}, function(user) {
        if (user) {
          $scope.user = user;
        }
      });
    });
  }, function(res) {
    $scope.errors = res.data;
  });
});

angular.module('buiiltApp')
.controller('FormQuoteCtrl', function($scope, $timeout, $q,$cookieStore,quoteService, userService, project,$stateParams, $state) {
  var currentUser = {};
  var project = project;
  userService.get({}, function(user) {
    if (user) {
      currentUser = user;
      var index = _.findIndex(project.requestedHomeBuilders, function(req){
        return req.email === currentUser.email;
      })
      if(index === -1){
        $state.go('home',{}, {reload : true});
      } 
      $scope.errors = {};
        $scope.quote = {
          };
        $scope.create = function(){
          quoteService.create({_id : $stateParams.id, params : $scope.quote}).$promise.then(function(data){
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
    }
  });
});