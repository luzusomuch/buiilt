angular.module('buiiltApp').controller('projectsCtrl', function ($rootScope, $scope, $timeout, $state, $mdDialog, projectService, inviteTokenService, projectsInvitation, teamInvitations, teamService, $mdToast) {
	$rootScope.title = "Projects List";
    $scope.autoCompleteRequireMath = true;
    $scope.selectedItem = null;
    $scope.search = false;
	$scope.projectsFilter = [];
    $scope.projects = $rootScope.projects;
    $scope.allowCreateProject = false;
    $scope.currentTeam = $rootScope.currentTeam;
	$scope.showFilter = false;
    /*Check if current user is team leader, so he can create project*/
    if ($rootScope.currentUser.isLeader && $scope.currentTeam._id && ($scope.currentTeam.type === "builder" || $scope.currentTeam.type === "architect")) {
        $scope.allowCreateProject = true;
    }

    $scope.projectsInvitation = projectsInvitation;
    $scope.teamInvitations = teamInvitations;

    /*Create new project then call mixpanel to track current user has created project
    then go to this project overview*/
    $scope.createProject = function(form) {
        $scope.submitted = true;
            if (form.$valid) {
                $scope.project.teamType = $scope.currentTeam.type;
                projectService.create($scope.project).$promise.then(function(data){
                    $scope.projects.push(data);
                    $scope.saveProject();
                    $state.go('project.overview', {id: data._id},{reload: true});
                    $scope.submitted = false;
					
					//Track Project Creation by User
					mixpanel.identify($rootScope.currentUser._id);
					mixpanel.track("Project Created");
					
                }, function(res) {
                    $scope.showToast(res.data.msg);
            });
        }
    };
    
    /*Show create new project modal*/
    $scope.showCreateProjectModal = function($event) {
        $mdDialog.show({
            targetEvent: $event,
            controller: 'projectsCtrl',
            resolve: {
                teamInvitations: ["authService", function(authService){
                    return authService.getCurrentInvitation().$promise;
                }],
                projectsInvitation: ["inviteTokenService", function(inviteTokenService) {
                    return inviteTokenService.getProjectsInvitation().$promise;
                }]
            },
            templateUrl: 'app/modules/projects/projects-create/projects-create.html',
            parent: angular.element(document.body),
            clickOutsideToClose:false
        });
    };
    
    /*Close create new project modal*/
    $scope.hideCreateProjectModal = function () {
        $mdDialog.cancel();
    };

    /*Filter with auto complete*/
    $scope.querySearch = function(value) {
        var results = value ? $scope.projects.filter(createFilter(value)) : [];
        results = _.uniq(results, '_id');
        return results;
    };

    function createFilter(query) {
        return function filterFn(project) {
            return project.name.toLowerCase().indexOf(query) > -1;
        };
    };

    /*Accept or reject team invitation*/
    $scope.selectInvitation = function(invitation, index) {
        var confirm = $mdDialog.confirm()
        .title("Do you want to join " + invitation.name + " ?")
        .ok("Join")
        .cancel("Ignore");
        $mdDialog.show(confirm).then(function() {
            $scope.accept(invitation);
        }, function() {
            $scope.reject(invitation,index);
        });
    };

    /*Accept invitation*/
    $scope.accept = function(invitation, index) {
        teamService.acceptTeam({_id: invitation._id}).$promise.then(function (res) {
            $scope.currentTeam = res;
            $rootScope.$emit('TeamUpdate',res);
            $scope.showToast("You Have Joined " + invitation.name + " Successfully.");
            $scope.teamInvitations.splice(index, 1);
        }, function (err) {
            $scope.showToast(err);
        });
    };

    /*Reject invitation*/
    $scope.reject = function(invitation, index) {
        teamService.rejectTeam({_id: invitation._id}).$promise.then(function () {
            $scope.teamInvitations.splice(index, 1);
            $scope.showToast("Reject " +invitation.name+ "successfully!");
        }, function (err) {
            $scope.showToast(err);
        });
    };

    /*Show toast dialog with inform*/
    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };
});