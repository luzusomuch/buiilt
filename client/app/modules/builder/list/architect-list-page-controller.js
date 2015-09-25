angular.module('buiiltApp')
.controller('ArchitectListPageController', function(socket,$rootScope,$scope, $window, $state, $stateParams, fileService, taskService, messageService,currentTeam, $cookieStore, authService, userService, builderRequest, builderPackageService, designs) {
    $scope.builderRequest = builderRequest;
    $scope.currentTeam = currentTeam;

    $scope.contentHeight = $rootScope.maximunHeight - $rootScope.headerHeight - $rootScope.footerHeight - 130;

    fileService.getFileByPackage({id: builderRequest._id, type: 'builder'}).$promise.then(function(files){
        $scope.builderRequest.files = files;
    });
    taskService.getByPackage({id: builderRequest._id, type: 'builder'}).$promise.then(function(tasks){
        $scope.builderRequest.tasks = tasks;
    });    
    messageService.getByPackage({id: builderRequest._id, type: 'builder'}).$promise.then(function(threads){
        $scope.builderRequest.threads = threads;
    });

    $scope.designs = designs;
    _.each($scope.designs, function(design){
        fileService.getFileByPackage({id: design._id, type: 'design'}).$promise.then(function(files){
            design.files = files;
        });
        taskService.getByPackage({id: design._id, type: 'design'}).$promise.then(function(tasks){
            design.tasks = tasks;
        });    
        messageService.getByPackage({id: design._id, type: 'design'}).$promise.then(function(threads){
            design.threads = threads;
        });
    });

    $scope.activeHover = function($event){
        angular.element($event.currentTarget).addClass("item-hover")
    };
    $scope.removeHover = function($event) {
        angular.element($event.currentTarget).removeClass("item-hover")
    };

    $scope.goToBuilderPackageDetail = function() {
        if (currentTeam.type == 'homeOwner') {
            $state.go('builderRequest.inProgress', {id: builderRequest.project._id});   
        } else {
            if (builderRequest.hasWinner && !builderRequest.hasTempWinner) {
                $state.go('builderRequest.inProgress', {id: builderRequest.project._id});
            } else {
                $state.go('builderRequest.sendQuote', {id: builderRequest.project._id});
            }
        }
    };

    $scope.goToDeSignDetail = function(design) {
        $state.go('design.detail', {id: design.project, packageId: design._id});
    };
});