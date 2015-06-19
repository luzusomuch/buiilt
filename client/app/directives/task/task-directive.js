angular.module('buiiltApp')
  .directive('task', function(){
  return {
    restrict: 'EA',
    templateUrl: 'app/directives/task/task.html',
    scope:{
      package: '=',
      type : '@',
      currentUser : '='
    },
    controller:
      function($scope,$rootScope,taskService, authService, $cookieStore, $stateParams, $rootScope, $location , packageService, userService, projectService, FileUploader, documentService) {
        $scope.currentProject = $rootScope.currentProject;
         authService.getCurrentUser().$promise.then(function(res) {
           $scope.currentUser = res;
        });
        $scope.isNew = true;
        $scope.filter = 'all';
        $scope.customFilter = {};
        var getAvailableAssignee = function(type) {
          switch(type) {
            case 'staff' :
              $scope.available =  angular.copy($scope.package.staffs);
              break;
            default :
              break
          }
        };
        getAvailableAssignee($scope.type);

        var updateTasks = function() {
          taskService.get({id : $scope.package._id, type : $scope.type}).$promise
            .then(function(res) {
              $scope.tasks = res;
              _.forEach($scope.tasks,function(task) {
                if (_.findIndex(task.assignees,{_id : $scope.currentUser._id}) != -1) {
                  task.isOwner = true;
                } else {
                  task.isOwner = false
                }
              })
            });
        }
        updateTasks();
        $scope.newTask = function() {
          $scope.task = {
            assignees : []
          };
          getAvailableAssignee($scope.type);
          $scope.isNew = true;
        };

        $scope.editTask = function(task) {
          $scope.task = angular.copy(task);
          _.forEach($scope.task.assignees,function(item) {
            _.remove($scope.available,{_id : item._id});
          })
          $scope.isNew = false;
        };

        $scope.assign = function(staff,index) {
          $scope.task.assignees.push(staff);
          $scope.available.splice(index,1);
        };

        $scope.revoke = function(assignee,index) {
          $scope.available.push(assignee);
          $scope.task.assignees.splice(index,1);
        };

        $scope.complete = function(task) {
          task.completed = !task.completed
          taskService.update({id : task._id, type : $scope.type},task).$promise
            .then(function(res) {
              //$('.card-title').trigger('click');
              updateTasks();
            })
        };

        $scope.save = function(form) {
          if (form.$valid) {
            if ($scope.isNew) {
              taskService.create({id : $scope.package._id, type : $scope.type},$scope.task).$promise
                .then(function(res) {
                  $('.card-title').trigger('click');
                  updateTasks();
                })
            } else {
              taskService.update({id : $scope.task._id, type : $scope.type},$scope.task).$promise
                .then(function(res) {
                  $('.card-title').trigger('click');
                  updateTasks();
                })
            }

          }
        }
      }
  }
});