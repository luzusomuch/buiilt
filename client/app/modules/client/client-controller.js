angular.module('buiiltApp').controller('ClientCtrl', function(messageService,addOnPackageService,taskService,fileService,variationRequestService,$scope, team, $state, $rootScope, $timeout, $q, builderPackage) {

    $scope.currentProject = $rootScope.currentProject;
    $scope.builderPackage = builderPackage;
    $scope.currentTeam = team;
    $scope.contentHeight = $rootScope.maximunHeight - $rootScope.headerHeight - $rootScope.footerHeight - 130;

    $scope.isShowBuilderPackageDetail = false;
    $("div.builderPackageDetail").css("display","none");
    $scope.goToBuilderPackageDetail = function(){
        // $scope.isShowBuilderPackageDetail = true;
        // $("div.builderPackageList").toggle("slide");
        // $("div.builderPackageDetail").css("display","block");
        $state.go("client.view", {id: $scope.builderPackage.project._id});
    };

    $scope.goToVariationRequest = function(variation) {
        if ($scope.currentTeam.type == 'homeOwner' && variation.isAccept) {
            $state.go("variationRequest.inProcess",{id: variation.project, variationId: variation._id});
        }
        else if ($scope.currentTeam.type == 'homeOwner' && !variation.isAccept) {
            $state.go("variationRequest.viewRequest",{id: variation.project, variationId: variation._id});
        }
        else if ($scope.currentTeam.type == 'builder' && variation.isAccept) {
            $state.go("variationRequest.inProcess",{id: variation.project, variationId: variation._id});
        }
        else if ($scope.currentTeam.type == 'builder' && !variation.isAccept) {
            $state.go("variationRequest.sendQuote",{id: variation.project, variationId: variation._id});
        }
    };

    $scope.backToList = function(){
        $scope.isShowBuilderPackageDetail = false;
        $("div.builderPackageList").toggle("slide");
        $("div.builderPackageList").css("display","block");
        $("div.builderPackageDetail").css("display","none");
    };

    $scope.isShowAll = true;

    $scope.activeHover = function($event){
        angular.element($event.currentTarget).addClass("item-hover")
    };
    $scope.removeHover = function($event) {
        angular.element($event.currentTarget).removeClass("item-hover")
    }

    
    fileService.getFileByPackage({id: $scope.builderPackage._id, type: 'builder'}).$promise.then(function(files){
        $scope.builderPackage.files = files;
    });
    taskService.getByPackage({id: $scope.builderPackage._id, type: 'builder'}).$promise.then(function(tasks){
        $scope.builderPackage.tasks = tasks;
    });    
    messageService.getByPackage({id: $scope.builderPackage._id, type: 'builder'}).$promise.then(function(threads){
        $scope.builderPackage.threads = threads;
    })
    
    if ($scope.currentTeam.type == 'contractor' || $scope.currentTeam.type == 'supplier') {
      $state.go('team.manager');
    }
    else {
        if (builderPackage.to.type == 'homeOwner') {
            if (team.type == 'builder') {
                if (builderPackage.owner._id != team._id) {
                    $state.go('team.manager');
                }
            }
            else if (team.type == 'homeOwner') {
                if (builderPackage.to.team._id != team._id) {
                    $state.go('team.manager');
                }
            }
        }
        else {
            if (team.type == 'builder') {
                if (builderPackage.to.team._id != team._id) {
                    $state.go('team.manager');
                }
            }
            else if (team.type == 'homeOwner') {
                if (builderPackage.owner._id != team._id) {
                    $state.go('team.manager');
                }
            }
        }
    }
    $scope.variations = [];
    variationRequestService.getVariationByPackage({id: $scope.builderPackage._id}).$promise.then(function(variations){
        $scope.variations =variations;
        _.each($scope.variations, function(variation){
            fileService.getFileByPackage({id: variation._id, type: 'variation'}).$promise.then(function(files){
              variation.files = files;
            });
            taskService.getByPackage({id: variation._id, type: 'variation'}).$promise.then(function(tasks){
              variation.tasks = tasks;
            });    
            messageService.getByPackage({id: variation._id, type: 'variation'}).$promise.then(function(threads){
                variation.threads = threads;
            })
        });
    });

    //send variation
    $scope.variation = {
        descriptions: []
    };
    $scope.quoteLater = true;
    $scope.addDescription = function(description){
        if (description) {
            $scope.variation.descriptions.push(description);
            $scope.description = '';
        }
    };
    $scope.removeDescription = function(index){
        $scope.variation.descriptions.splice(index,1);
    };
    $scope.$watchGroup(['variation.descriptions.length','submitted'],function(value) {
        $scope.descriptionError = (value[0] <= 0 && value[1])
    });
    $scope.sendVariation = function() {
        if ($scope.variation.title) {
            addOnPackageService.sendVariation({id: $scope.builderPackage._id, 
                quoteLater: $scope.quoteLater,
                packageType: $scope.builderPackage.type, variation: $scope.variation})
            .$promise.then(function(data) {
                fileService.getFileByPackage({id: data._id, type: 'variation'}).$promise.then(function(files){
                    data.files = files;
                });
                taskService.getByPackage({id: data._id, type: 'variation'}).$promise.then(function(tasks){
                    data.tasks = tasks;
                });
                $scope.variations.push(data);
                // $scope.data = $scope.package.variations.push(data);
                $scope.variation.title = null;
                $scope.variation.descriptions = [];
              // $scope.messages = data;
            });
        }
    };
})
.controller('ClientViewCtrl', function(messageService,addOnPackageService,taskService,fileService,variationRequestService,$scope, team, $state, $rootScope, $timeout, $q, builderPackage) {
    $scope.currentProject = $rootScope.currentProject;
    $scope.builderPackage = builderPackage;
    $scope.currentTeam = team;
    if ($scope.currentTeam.type == 'contractor' || $scope.currentTeam.type == 'supplier') {
      $state.go('team.manager');
    }
    else {
        if (builderPackage.to.type == 'homeOwner') {
            if (team.type == 'builder') {
                if (builderPackage.owner._id != team._id) {
                    $state.go('team.manager');
                }
            }
            else if (team.type == 'homeOwner') {
                if (builderPackage.to.team._id != team._id) {
                    $state.go('team.manager');
                }
            }
        }
        else {
            if (team.type == 'builder') {
                if (builderPackage.to.team._id != team._id) {
                    $state.go('team.manager');
                }
            }
            else if (team.type == 'homeOwner') {
                if (builderPackage.owner._id != team._id) {
                    $state.go('team.manager');
                }
            }
        }
    }
});