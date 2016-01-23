angular.module('buiiltApp').controller('projectsCtrl', function ($rootScope, $scope, $timeout, $state, $mdDialog, projectService, inviteTokenService, projectsInvitation, teamInvitations, teamService, $mdToast) {
	$rootScope.title = "Projects List";
    $scope.autoCompleteRequireMath = true;
    $scope.selectedItem = null;
    $scope.search = false;
	$scope.projectsFilter = [];
    $scope.projects = $rootScope.projects;
    $scope.allowCreateProject = false;
    $scope.currentTeam = $rootScope.currentTeam;
    if ($rootScope.currentUser.isLeader && $scope.currentTeam._id && ($scope.currentTeam.type === "builder" || $scope.currentTeam.type === "architect")) {
        $scope.allowCreateProject = true;
    }

    $scope.projectsInvitation = projectsInvitation;
    $scope.teamInvitations = teamInvitations;

    $scope.createProject = function(form) {
        $scope.submitted = true;
            if (form.$valid) {
                $scope.project.teamType = $scope.currentTeam.type;
                projectService.create($scope.project).$promise.then(function(data){
                    $scope.projects.push(data);
                    $scope.saveProject();
                    $state.go('project.overview', {id: data._id},{reload: true});
                    $scope.submitted = false;
                }, function(res) {
                $scope.showToast(res.data.msg);
            });
        }
    };
    
    $scope.saveProject = function (){
        $mdDialog.hide();
    };
    
    //Functions to Handle the Create Project Dialog.
    $scope.showCreateProjectModal = function($event) {
    
        $mdDialog.show({
            targetEvent: $event,
            controller: 'projectsCtrl',
            resolve: {
                teamInvitations: function(authService){
                    return authService.getCurrentInvitation().$promise;
                },
                projectsInvitation: function(inviteTokenService) {
                    return inviteTokenService.getProjectsInvitation().$promise;
                }
            },
            templateUrl: 'app/modules/projects/projects-create/projects-create.html',
            parent: angular.element(document.body),
            clickOutsideToClose:false
        });
        
    };
    
    $scope.hideCreateProjectModal = function () {
        $mdDialog.cancel();
    };
    

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

    $scope.addChip = function() {
        $scope.search = true;
    };

    $scope.removeChip = function() {
        if ($scope.projectsFilter.length === 0) {
            $scope.search = false;
        }
    };

    $scope.selectInvitation = function(invitation, index) {
        var confirm = $mdDialog.confirm()
        .title("Do you want to join or reject " + invitation.name + " team?")
        .ok("Join this team")
        .cancel("Reject this team");
        $mdDialog.show(confirm).then(function() {
            $scope.accept(invitation);
        }, function() {
            $scope.reject(invitation,index);
        });
    };

    $scope.accept = function(invitation, index) {
        teamService.acceptTeam({_id: invitation._id}).$promise.then(function (res) {
            $scope.currentTeam = res;
            $rootScope.$emit('TeamUpdate',res);
            $scope.showToast("Join team " + invitation.name + " successfully!");
            $scope.teamInvitations.splice(index, 1);
        }, function (err) {
            $scope.showToast(err);
        });
    };

    $scope.reject = function(invitation, index) {
        teamService.rejectTeam({_id: invitation._id}).$promise.then(function () {
            $scope.teamInvitations.splice(index, 1);
            $scope.showToast("Reject " +invitation.name+ "successfully!");
        }, function (err) {
            $scope.showToast(err);
        });
    };

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };
});