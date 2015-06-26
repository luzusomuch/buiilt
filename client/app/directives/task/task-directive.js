angular.module('buiiltApp')
  .directive('task', function(){
  return {
    restrict: 'EA',
    templateUrl: 'app/directives/task/task.html',
    scope:{
      package: '=',
      type : '@'
    },
    controller:
      function($scope,$rootScope,taskService, authService,filterFilter, $cookieStore, $stateParams, $rootScope, $location , packageService, userService, projectService, FileUploader, documentService) {
        //Init Params

        $scope.currentProject = $rootScope.currentProject;
        authService.getCurrentUser().$promise.then(function(res) {
           $scope.currentUser = res;

            authService.getCurrentTeam().$promise.then(function(res) {
              $scope.currentTeam = res;
              $scope.isLeader = (_.find($scope.currentTeam.leader,{_id : $scope.currentUser._id})) ? true : false;
              getAvailableAssignee($scope.type);
              updateTasks();

            });
        });

        $scope.isNew = true;
        $scope.filter = 'all';
        $scope.customFilter = {};

        //Get Available assignee to assign to task
        var getAvailableAssignee = function(type) {
          switch(type) {
            case 'staff' :
              $scope.available =  angular.copy($scope.package.staffs);
              $scope.available = _.union($scope.available,$scope.currentTeam.leader);
              break;
            case 'contractor' :
              $scope.available = [];
              _.forEach($scope.currentTeam.member,function(member) {
                if (member.status == 'Active') {
                  $scope.available.push(member._id);
                }
              });
              if ($scope.currentTeam.type == 'contractor') {
                _.forEach($scope.package.owner.leader,function(leader) {
                    $scope.available.push(leader);
                });
              }
              console.log($scope.currentTeam.type);
              console.log($scope.currentTeam.type == 'builder' );
              if ($scope.currentTeam.type == 'builder') {
                _.forEach($scope.package.winnerTeam._id.leader,function(leader) {
                  $scope.available.push(leader);
                });
              }
              $scope.available = _.union($scope.available,$scope.currentTeam.leader);
              break;
            case 'material' :
              $scope.available = [];
              _.forEach($scope.package.winnerTeam._id.member,function(member) {
                if (member.status == 'Active') {
                  $scope.available.push(member._id);
                }
              });
              _.forEach($scope.package.winnerTeam._id.leader,function(leader) {
                $scope.available.push(leader);
              });
              $scope.available = _.union($scope.available,$scope.currentTeam.leader);
              break;
            default :
              break
          }
        };



        //Update Task List
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
        };


        //Function fired when click new task
        $scope.newTask = function() {
          $scope.task = {
            assignees : []
          };
          getAvailableAssignee($scope.type);
          $scope.isNew = true;
        };

        //Function fired when click edit task
        $scope.editTask = function(task) {
          $scope.task = angular.copy(task);
          getAvailableAssignee($scope.type);
          _.forEach($scope.task.assignees,function(item) {
            if (!_.find($scope.available,{_id : item._id})) {
              item.canRevoke = false;
            } else {
              item.canRevoke = true;
            }
            _.remove($scope.available,{_id : item._id});
          });
          $scope.isNew = false;

        };

        //Assign people to task
        $scope.assign = function(staff,index) {
          staff.canRevoke = true;
          $scope.task.assignees.push(staff);
          $scope.available.splice(index,1);
        };

        //Revoke people to task
        $scope.revoke = function(assignee,index) {
          $scope.available.push(assignee);
          $scope.task.assignees.splice(index,1);
        };

        //Complete task
        $scope.complete = function(task) {
          task.completed = !task.completed;
          if (task.completed) {
            task.completedBy = $scope.currentUser._id;
            task.completedAt = new Date();
          } else {
            task.completedBy = null;
            task.completedAt = null;
          }
          taskService.update({id : task._id, type : $scope.type},task).$promise
            .then(function(res) {
              //$('.card-title').trigger('click');
              updateTasks();
            })
        };

        //Submit form function
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