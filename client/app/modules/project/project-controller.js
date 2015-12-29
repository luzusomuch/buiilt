angular.module('buiiltApp').controller('projectCtrl', function($rootScope, $scope, $timeout, $state, projectService, $mdDialog, $stateParams, project, $mdToast) {
    $rootScope.project = $scope.project = project;
    $rootScope.title = "Project " + $scope.project.name + " detail";
    $scope.errors = {};
    $scope.success = {};

    $scope.editProject = function(form) {
        if (form.$valid) {
            projectService.updateProject({id: $scope.project._id}, $scope.project).$promise.then(function(res) {
                $rootScope.project = $scope.project = res;
            }, function(err) {
                console.log(err);
            });
        }
    };

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('top','left').hideDelay(3000));
    };
    
});