angular.module('buiiltApp').controller('projectCtrl', function($rootScope, $scope, $timeout, $state, projectService, $mdDialog, $stateParams, $mdToast, uploadService, peopleService, people, tenders) {
	$scope.project = $rootScope.project;
    $rootScope.title = $scope.project.name + " Overview";
    $scope.people = people;
    $scope.tenders = tenders;
    var userType;
    _.each($rootScope.roles, function(role) {
        _.each($scope.people[role], function(tender) {
            if (!tender.hasSelect) {
                if (_.findIndex(tender.tenderers, function(tenderer) {
                    if (tenderer._id) {
                        return tenderer._id._id.toString() === $rootScope.currentUser._id.toString();
                    }
                }) !== -1) {
                    $scope.showSubmitTender = true;
                    userType = role;
                }
            }
        });
    });

    $scope.errors = {};
    $scope.success = {};

    /*
    Edit project when enter valid form and current user is project manager
    If success then call mixpanel track current user has updated project detail
    */
    $scope.editProject = function(form) {
        if (form.$valid && $scope.project.projectManager._id == $rootScope.currentUser._id) {
            projectService.updateProject({id: $scope.project._id}, $scope.project).$promise.then(function(res) {
                $rootScope.project = $scope.project = res;
                $scope.showToast("Your Edits Have Been Saved.");
				$mdDialog.hide();
				
				//Project Details Updated
				mixpanel.identify($rootScope.currentUser._id);
				mixpanel.track("Project Details Updated");
				
            }, function(err) {
                $scope.showToast("There Has Been An Error...");
            });
        } else {
            $scope.showToast("Not Valid Input Or You Are Not A Project Manager");
        }
    };
	
    /*Show toast information*/
    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
    };
	
    /*Show edit project detail modal*/
	$scope.showEditProjectModal = function($event){
		$mdDialog.show({
		    targetEvent: $event,
	        controller: 'projectCtrl',
            resolve: {
                people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }],
                tenders: ["tenderService", "$stateParams", function(tenderService, $stateParams) {
                    return tenderService.getAll({id: $stateParams.id}).$promise;
                }],
            },
	        templateUrl: 'app/modules/project/project-overview/partials/project-overview-edit.html',
	        parent: angular.element(document.body),
	        clickOutsideToClose: false
	    });
	};
	
    /*Close current modal*/
	$scope.closeDialog = function(){
		$mdDialog.cancel();
	};

    /*
    Restriction project manager
    If success, selected project'll be move to archived projects list.
    */
    $scope.archiveProject = function() {
        if ($rootScope.currentUser._id == $scope.project.projectManager._id) {
            var confirm = $mdDialog.confirm().title("Do you want to archive this project?").ok("Yes").cancel("No");
            $mdDialog.show(confirm).then(function() {
                $scope.project.archive = true;
                projectService.updateProject({id: $stateParams.id}, $scope.project).$promise.then(function(res) {
                    $scope.showToast("Your Project Has Been Archived Successfully.");
                    $scope.closeDialog();
                    $state.go("projects.archived");
                    $rootScope.$broadcast("Project.Archive", res);
                }, function(err) {
                    $scope.showToast("There Has Been An Error...");
                });
            }, function() {
                
            });
        } else {
            $scope.showToast("Not Authorization");
        }
    };

    /*
    Download a backup of current project
    The backup file'll send via current user email
    */
    $scope.downloadBackUp = function() {
        projectService.downloadBackUp({id: $stateParams.id}).$promise.then(function(res) {
            $scope.showToast("Please Check Your Inbox For The Backup File...");
        }, function(err) {$scope.showToast(err.message);});
    };
});