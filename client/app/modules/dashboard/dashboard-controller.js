angular.module('buiiltApp')
  .controller('DashboardCtrl', function($scope, $timeout, $q, userService, $rootScope,myTasks,taskService) {
    $scope.currentUser = userService.get();
    $scope.currentProject = $rootScope.currentProject;
    $scope.myTasks = myTasks;
    $scope.currentList = 'tasks';

    var getAvailableAssignee = function($package,type) {
      switch(type) {
        case 'builder' :
          $scope.available = [];
          $scope.available = _.union($scope.available,$scope.currentTeam.leader);
          if ($scope.currentTeam._id == $scope.package.owner._id && $scope.isLeader) {
            if ($scope.package.to.team) {
              _.forEach($scope.package.to.team.leader, function (leader) {
                $scope.available.push(leader);
              })
            }
          }
          if ($scope.package.to.team && $scope.currentTeam._id == $scope.package.to.team._id && $scope.isLeader) {
            _.forEach($scope.package.owner.leader, function (leader) {
              $scope.available.push(leader);
            })
          }
          _.forEach($scope.currentTeam.member,function(member) {
            if (member.status == 'Active') {
              $scope.available.push(member._id);
            }
          });
          break;
        case 'staff' :
          $scope.available =  angular.copy($package.staffs);
          $scope.available = _.union($scope.available,$scope.currentTeam.leader);
          break;
        case 'contractor' :
          $scope.available = [];
          $scope.available = _.union($scope.available,$scope.currentTeam.leader);
          if ($scope.currentTeam._id == $package.winnerTeam._id._id && $scope.isLeader) {
            _.forEach($package.owner.leader,function(leader) {
              $scope.available.push(leader);
            });
          }
          if ($scope.currentTeam._id == $package.owner._id && $scope.isLeader) {
            _.forEach($package.winnerTeam._id.leader,function(leader) {
              $scope.available.push(leader);
            });
          }
          _.forEach($scope.currentTeam.member,function(member) {
            if (member.status == 'Active') {
              $scope.available.push(member._id);
            }
          });
          break;
        case 'material' :
          $scope.available = [];
          $scope.available = _.union($scope.available,$scope.currentTeam.leader);
          if ($scope.currentTeam._id == $package.winnerTeam._id._id && $scope.isLeader) {
            _.forEach($package.owner.leader,function(leader) {
              $scope.available.push(leader);
            });
          }
          if ($scope.currentTeam._id == $package.owner._id  && $scope.isLeader) {
            _.forEach($package.winnerTeam._id.leader,function(leader) {
              $scope.available.push(leader);
            });
          }
          _.forEach($scope.currentTeam.member,function(member) {
            if (member.status == 'Active') {
              $scope.available.push(member._id);
            }
          });
          break;
        default :
          break
      }
    };

    $scope.showTasks = function() {
      $scope.currentList = 'tasks';
    };

    $scope.showChats = function() {
      $scope.currentList = 'chats';
    };

    $scope.showDocs = function() {
      $scope.currentList = 'docs';
    };

    $scope.showTask = function(task) {
      $scope.isShow = true;
      $scope.available = [];
      getAvailableAssignee(task.package,task.type);
      _.forEach(task.assignees,function(item) {
        if (!_.find($scope.available,{_id : item._id})) {
          item.canRevoke = false;
        } else {
          item.canRevoke = true;
        }
        _.remove($scope.available,{_id : item._id});
      });
    };

    $scope.complete = function(task,index) {
      task.completed = true
      task.completedBy = $scope.currentUser._id;
      task.completedAt = new Date();

      taskService.update({id : task._id, type : task.type},task).$promise
        .then(function(res) {
          //$('.card-title').trigger('click');
          //updateTasks();
          $scope.myTasks.splice(index,1);
        })
    }
    console.log(myTasks)
});
